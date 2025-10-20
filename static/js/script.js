// static/js/script.js

document.addEventListener('DOMContentLoaded', function() {

    // --- Логика для главной страницы (index.html) ---
    const form = document.getElementById('process-form');
    const savedTemplateSelect = document.getElementById('saved_template');
    const newTemplateFields = document.getElementById('new-template-fields');

    // ----- НАЧАЛО ИСПРАВЛЕНИЙ -----
    const addRuleButton = document.getElementById('add-manual-rule');
    const rulesContainer = document.getElementById('manual-rules-container');

    if (addRuleButton) {
        addRuleButton.addEventListener('click', function() {
            // 1. Создаем главный контейнер для правила
            const ruleDiv = document.createElement('div');
            // Задаем стили, чтобы элементы внутри него выстроились в ряд
            ruleDiv.style.display = 'flex';
            ruleDiv.style.alignItems = 'center';
            ruleDiv.style.gap = '10px';
            ruleDiv.style.marginBottom = '1rem';

            // 2. Создаем и настраиваем все элементы по отдельности
            const sourceInput = document.createElement('input');
            sourceInput.type = 'text';
            sourceInput.name = 'manual_source_col'; // <-- Исправление #1: добавляем имя
            sourceInput.placeholder = 'Колонка источника (напр. A)';
            sourceInput.className = 'form-control';
            sourceInput.style.width = 'auto'; // <-- Исправление #2: отменяем 'width: 100%' из CSS
            sourceInput.style.flex = '1';

            const arrow = document.createElement('span');
            arrow.textContent = '→';
            arrow.style.fontWeight = 'bold';

            const templateInput = document.createElement('input');
            templateInput.type = 'text';
            templateInput.name = 'manual_template_col'; // <-- Исправление #1: добавляем имя
            templateInput.placeholder = 'Колонка шаблона (напр. C)';
            templateInput.className = 'form-control';
            templateInput.style.width = 'auto'; // <-- Исправление #2: отменяем 'width: 100%' из CSS
            templateInput.style.flex = '1';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-danger remove-rule-btn';
            removeBtn.textContent = '×';

            // 3. Добавляем созданные элементы в контейнер
            ruleDiv.appendChild(sourceInput);
            ruleDiv.appendChild(arrow);
            ruleDiv.appendChild(templateInput);
            ruleDiv.appendChild(removeBtn);

            rulesContainer.appendChild(ruleDiv);
        });

        // Логика для кнопки удаления
        rulesContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-rule-btn')) {
                e.target.parentElement.remove();
            }
        });
    }
    // ----- КОНЕЦ ИСПРАВЛЕНИЙ -----

    if (savedTemplateSelect) {
        savedTemplateSelect.addEventListener('change', function() {
            newTemplateFields.style.display = this.value ? 'none' : 'block';
        });
        newTemplateFields.style.display = savedTemplateSelect.value ? 'none' : 'block';
    }

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(form);
            const errorContainer = document.getElementById('error-messages');
            const progressContainer = document.getElementById('progress-container');
            const downloadLink = document.getElementById('download-link');

            errorContainer.style.display = 'none';
            errorContainer.textContent = '';
            progressContainer.style.display = 'block';
            downloadLink.style.display = 'none';

            fetch(form.action, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                if (data.task_id) {
                    pollStatus(data.task_id);
                }
            })
            .catch(error => {
                errorContainer.textContent = 'Произошла ошибка: ' + error.message;
                errorContainer.style.display = 'block';
                progressContainer.style.display = 'none';
            });
        });
    }

    function pollStatus(taskId) {
        const statusText = document.getElementById('status-text');
        const progressBar = document.getElementById('progress-bar');
        const downloadLink = document.getElementById('download-link');

        const interval = setInterval(() => {
            fetch(`/status/${taskId}`)
                .then(response => response.json())
                .then(data => {
                    statusText.textContent = data.status || 'Обработка...';
                    progressBar.style.width = (data.progress || 0) + '%';

                    if (data.progress >= 100) {
                        clearInterval(interval);
                        if (data.result_file) {
                            downloadLink.href = `/download/${data.result_file}`;
                            downloadLink.textContent = `Скачать результат (${data.result_file})`;
                            downloadLink.style.display = 'block';
                        }
                    }
                })
                .catch(error => {
                    clearInterval(interval);
                    statusText.textContent = 'Ошибка при проверке статуса.';
                });
        }, 2000);
    }

    // --- Логика для других страниц ---
    const dictionaryForm = document.getElementById('dictionary-form');
    const valueDictionaryForm = document.getElementById('value-dictionary-form');

    // Обработчик для страницы Словаря Заголовков
    if (dictionaryForm) {
        const itemList = document.querySelector('.item-list');
        if (itemList) {
            itemList.addEventListener('click', function(e) {
                if (e.target && e.target.classList.contains('edit-btn')) {
                    const button = e.target;
                    const canonical = button.dataset.canonical;
                    const synonyms = button.dataset.synonyms;

                    dictionaryForm.querySelector('#canonical_name').value = canonical;
                    dictionaryForm.querySelector('#synonyms').value = synonyms;
                    dictionaryForm.querySelector('button[type="submit"]').textContent = 'Обновить запись';
                    dictionaryForm.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    // Обработчик для страницы Словаря Значений
    if (valueDictionaryForm) {
        const itemList = document.querySelector('.item-list');
        if (itemList) {
            itemList.addEventListener('click', function(e) {
                if (e.target && e.target.classList.contains('edit-btn')) {
                    const button = e.target;
                    const canonical = button.dataset.canonical;
                    const synonyms = button.dataset.synonyms;

                    valueDictionaryForm.querySelector('#canonical_word').value = canonical;
                    valueDictionaryForm.querySelector('#find_words').value = synonyms;
                    valueDictionaryForm.querySelector('button[type="submit"]').textContent = 'Обновить правило';
                    valueDictionaryForm.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }
});