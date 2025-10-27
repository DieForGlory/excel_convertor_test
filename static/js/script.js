// static/js/script.js

document.addEventListener('DOMContentLoaded', function() {

    // --- Логика для страницы редактирования шаблона (edit_template.html) ---
    const addRuleButton = document.getElementById('add-manual-rule');
    const rulesContainer = document.getElementById('manual-rules-container');

    if (addRuleButton && rulesContainer) {
        // Функция для добавления нового ряда с правилом
        addRuleButton.addEventListener('click', function() {
            // Создаем все необходимые элементы, точно как в HTML
            const ruleRow = document.createElement('div');
            ruleRow.className = 'rule-row';

            // Блок "Из ячейки"
            const sourceGroup = document.createElement('div');
            sourceGroup.className = 'rule-input-group';
            const sourceLabel = document.createElement('label');
            sourceLabel.textContent = 'Из ячейки';
            const sourceInput = document.createElement('input');
            sourceInput.type = 'text';
            sourceInput.name = 'source_cell'; // <-- Важнейшее исправление: правильное имя
            sourceInput.placeholder = 'A1';
            sourceInput.required = true;
            sourceGroup.appendChild(sourceLabel);
            sourceGroup.appendChild(sourceInput);

            // Стрелка
            const arrow = document.createElement('div');
            arrow.className = 'rule-arrow';
            arrow.textContent = '→';

            // Блок "В колонку"
            const templateGroup = document.createElement('div');
            templateGroup.className = 'rule-input-group';
            const templateLabel = document.createElement('label');
            templateLabel.textContent = 'В колонку';
            const templateInput = document.createElement('input');
            templateInput.type = 'text';
            templateInput.name = 'template_col'; // <-- Важнейшее исправление: правильное имя
            templateInput.placeholder = 'B';
            templateInput.required = true;
            templateGroup.appendChild(templateLabel);
            templateGroup.appendChild(templateInput);

            // Кнопка удаления
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-danger btn-sm remove-rule-btn';
            removeBtn.textContent = 'Удалить';
            removeBtn.style.alignSelf = 'center';
            removeBtn.style.marginTop = '1rem';

            // Собираем всё вместе
            ruleRow.appendChild(sourceGroup);
            ruleRow.appendChild(arrow);
            ruleRow.appendChild(templateGroup);
            ruleRow.appendChild(removeBtn);

            // Добавляем готовый ряд в контейнер
            rulesContainer.appendChild(ruleRow);
        });

        // Функция для удаления правила (улучшенная)
        rulesContainer.addEventListener('click', function(e) {
            // Проверяем, что клик был именно по кнопке удаления
            if (e.target.classList.contains('remove-rule-btn')) {
                // Находим родительский элемент .rule-row и удаляем его
                e.target.closest('.rule-row').remove();
            }
        });
    }


    // --- Логика для главной страницы (index.html) ---
    const form = document.getElementById('process-form');
    const savedTemplateSelect = document.getElementById('saved_template');
    const newTemplateFields = document.getElementById('new-template-fields');

    if (savedTemplateSelect) {
        savedTemplateSelect.addEventListener('change', function() {
            newTemplateFields.style.display = this.value ? 'none' : 'block';
        });
        // Устанавливаем правильное состояние при загрузке страницы
        if (newTemplateFields) {
           newTemplateFields.style.display = savedTemplateSelect.value ? 'none' : 'block';
        }
    }

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(form);
            const errorContainer = document.getElementById('error-messages');
            const progressContainer = document.getElementById('progress-container');
            const downloadLink = document.getElementById('download-link');

            if(errorContainer) {
                errorContainer.style.display = 'none';
                errorContainer.textContent = '';
            }
            if(progressContainer) progressContainer.style.display = 'block';
            if(downloadLink) downloadLink.style.display = 'none';

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
                if(errorContainer){
                    errorContainer.textContent = 'Произошла ошибка: ' + error.message;
                    errorContainer.style.display = 'block';
                }
                if(progressContainer) progressContainer.style.display = 'none';
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
                    if (statusText) statusText.textContent = data.status || 'Обработка...';
                    if (progressBar) progressBar.style.width = (data.progress || 0) + '%';

                    if (data.progress >= 100) {
                        clearInterval(interval);
                        if (data.result_file && downloadLink) {
                            downloadLink.href = `/download/${data.result_file}`;
                            downloadLink.textContent = `Скачать результат (${data.result_file})`;
                            downloadLink.style.display = 'block';
                        }
                    }
                })
                .catch(error => {
                    clearInterval(interval);
                    if(statusText) statusText.textContent = 'Ошибка при проверке статуса.';
                });
        }, 2000);
    }

    // --- Логика для других страниц (словари) ---
    function initializeDictionaryPage(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const itemList = document.querySelector('.item-list');
        if (!itemList) return;

        itemList.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('edit-btn')) {
                const button = e.target;
                const canonical = button.dataset.canonical;
                const synonyms = button.dataset.synonyms;

                // Универсальный поиск полей
                form.querySelector('input[id*="canonical"]').value = canonical;
                form.querySelector('input[id*="synonyms"], input[id*="find_words"]').value = synonyms;
                form.querySelector('button[type="submit"]').textContent = 'Обновить';
                form.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    initializeDictionaryPage('dictionary-form');
    initializeDictionaryPage('value-dictionary-form');
});