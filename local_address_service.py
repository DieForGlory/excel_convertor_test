# local_address_service.py
import csv
import os
import re  # <-- Импортируем модуль для работы с регулярными выражениями
from threading import Lock
import numpy as np
from scipy.spatial import cKDTree
from thefuzz import process as fuzz_process


def normalize_address_string(s):
    """
    Удаляет из строки все знаки препинания, пробелы и приводит к нижнему регистру.
    Например: "г. Тула, ул. Ленина, д. 10" -> "гтулаулицаленинадом10"
    """
    if not isinstance(s, str):
        return ""
    # Удаляем все, что не является буквой или цифрой
    return re.sub(r'[\W_]+', '', s).lower()


class LocalAddressService:
    def __init__(self, csv_file_path='addresses.csv'):
        self.csv_file_path = csv_file_path

        # --- Данные для поиска "Адрес -> Координаты" ---
        # Ключ - нормализованный адрес, значение - (широта, долгота)
        self.normalized_address_to_coords = {}
        # Список оригинальных (ненормализованных) адресов для нечеткого поиска
        self.address_choices = {}

        # --- Данные для поиска "Координаты -> Адрес" ---
        self.kdtree = None
        self.kdtree_data = []

        self._lock = Lock()
        self._load_data()

    def _load_data(self):
        with self._lock:
            if not os.path.exists(self.csv_file_path):
                print(f"Внимание: Файл с адресами не найден: {self.csv_file_path}")
                return

            points = []
            try:
                with open(self.csv_file_path, mode='r', encoding='utf-8') as infile:
                    reader = csv.reader(infile)
                    for row in reader:
                        if len(row) == 3:
                            address, lat_str, lon_str = row
                            try:
                                original_address = address.strip()
                                normalized_addr = normalize_address_string(original_address)
                                lat, lon = float(lat_str), float(lon_str)

                                # Заполняем словари для поиска
                                self.normalized_address_to_coords[normalized_addr] = (lat_str.strip(), lon_str.strip())
                                self.address_choices[normalized_addr] = original_address

                                # Данные для k-d tree
                                points.append((lat, lon))
                                self.kdtree_data.append(original_address)

                            except (ValueError, TypeError):
                                continue

                if points:
                    self.kdtree = cKDTree(np.array(points))

            except Exception as e:
                print(f"Ошибка при загрузке файла с адресами: {e}")

    def get_coords(self, address):
        """
        Ищет координаты по адресу с использованием улучшенной нормализации.
        """
        if not address: return None, None

        # 1. Нормализуем входящий адрес
        normalized_query = normalize_address_string(address)

        # 2. Ищем точное совпадение по нормализованному ключу (самый быстрый и точный способ)
        exact_match = self.normalized_address_to_coords.get(normalized_query)
        if exact_match:
            return exact_match

        # 3. Если не нашли, используем нечеткий поиск по нормализованным ключам
        if not self.address_choices: return None, None

        # Находим лучший вариант среди нормализованных адресов
        best_match_normalized, score = fuzz_process.extractOne(normalized_query, self.address_choices.keys())

        # Если совпадение достаточно хорошее, возвращаем его координаты
        if score > 85:  # Можно поднять порог для большей точности
            return self.normalized_address_to_coords.get(best_match_normalized)

        return None, None

    def get_address(self, lat, lon):
        """ Ищет ближайший адрес по координатам (без изменений) """
        if self.kdtree is None: return None
        if lat is None or lon is None: return None
        try:
            distance, index = self.kdtree.query(np.array([float(lat), float(lon)]))
            return self.kdtree_data[index]
        except (ValueError, TypeError):
            return None


# --- Остальная часть файла без изменений ---
address_service = LocalAddressService()


def get_coordinates(address):
    return address_service.get_coords(address)


def get_address_by_coords(lat, lon):
    return address_service.get_address(lat, lon)