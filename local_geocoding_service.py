# local_geocoding_service.py
from utils import find_column_indices
from local_address_service import get_coordinates, get_address_by_coords


def apply_post_processing(task_id, workbook, start_row, function_name, task_statuses):
    """
    Применяет функции пост-обработки с подробным логированием для диагностики.
    """
    print(f"--- НАЧАЛО ДИАГНОСТИКИ ГЕОКОДИНГА ---")
    print(f"DEBUG: Запущена пост-обработка. Выбранная функция: '{function_name}'")

    if function_name not in ['address_to_coords', 'coords_to_address']:
        print("DEBUG: Функция не выбрана, пост-обработка пропущена.")
        print(f"--- КОНЕЦ ДИАГНОСТИКИ ---")
        return

    worksheet = workbook.active

    # Ищем колонки
    cols = find_column_indices(worksheet, start_row, {'lat': 'Широта', 'lon': 'Долгота', 'addr': 'Адрес'})
    print(f"DEBUG: Результат поиска колонок: {cols}")

    if not all(k in cols for k in ['lat', 'lon', 'addr']):
        print(
            "!!! КРИТИЧЕСКАЯ ОШИБКА: Не найдены все обязательные колонки ('Широта', 'Долгота', 'Адрес'). Процесс остановлен.")
        task_statuses[task_id]['status'] = "Ошибка: не найдены колонки Широта/Долгота/Адрес."
        print(f"--- КОНЕЦ ДИАГНОСТИКИ ---")
        return

    rows_processed = 0

    if function_name == 'address_to_coords':
        print("DEBUG: Выполняется сценарий 'Адрес -> Координаты'")
        # Проходим по каждой строке в Excel-файле
        for i, row_cells in enumerate(worksheet.iter_rows(min_row=start_row + 1, max_row=worksheet.max_row)):
            # Получаем ячейку с адресом
            address_cell = row_cells[cols['addr'] - 1]
            address_value = address_cell.value

            # ВЫВОДИМ В ЛОГ ЗНАЧЕНИЕ ИЗ ПЕРВЫХ 5 СТРОК ДЛЯ ПРОВЕРКИ
            if i < 5:
                print(
                    f"  -> Проверка строки {start_row + 1 + i}: Значение в ячейке 'Адрес' = '{address_value}' (Тип: {type(address_value)})")

            if address_value:
                # Для каждого адреса ищем координаты
                lat, lon = get_coordinates(str(address_value))
                if lat and lon:
                    worksheet.cell(row=start_row + 1 + i, column=cols['lat']).value = float(lat)
                    worksheet.cell(row=start_row + 1 + i, column=cols['lon']).value = float(lon)
                    rows_processed += 1
        task_statuses[task_id]['status'] = f"Адрес -> Координаты: обработано {rows_processed} адресов."

    elif function_name == 'coords_to_address':
        # ... (этот блок пока без изменений) ...
        pass

    print(f"DEBUG: Пост-обработка завершена. Успешно найдено координат: {rows_processed}")
    print(f"--- КОНЕЦ ДИАГНОСТИКИ ---")