// static/js/script.js

document.addEventListener('DOMContentLoaded', function() {

    // --- Логика для главной страницы (index.html) ---
    const form = document.getElementById('process-form');
    const savedTemplateSelect = document.getElementById('saved_template');
    const newTemplateFields = document.getElementById('new-template-fields');

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
                pollStatus(data.task_id);
            })
            .catch(error => {
                progressContainer.style.display = 'none';
                errorContainer.textContent = `Произошла ошибка: ${error.message}`;
                errorContainer.style.display = 'block';
            });
        });
    }

    function pollStatus(taskId) {
        const statusUrl = `/status/${taskId}`;
        const interval = setInterval(() => {
            fetch(statusUrl)
            .then(response => response.json())
            .then(data => {
                const statusBar = document.getElementById('progress-bar');
                const statusText = document.getElementById('status-text');

                statusText.textContent = data.status || 'Обработка...';
                const progress = data.progress || 0;
                statusBar.style.width = `${progress}%`;
                statusBar.textContent = `${progress}%`;

                if (progress >= 100) {
                    clearInterval(interval);
                    if (data.result_file) {
                        const downloadLink = document.getElementById('download-link');
                        downloadLink.href = `/download/${data.result_file}`;
                        downloadLink.style.display = 'inline-block';
                        statusText.textContent = 'Готово! Ваш файл можно скачать.';
                    } else if(data.status && data.status.startsWith('Ошибка')) {
                        statusBar.style.backgroundColor = 'var(--error-color)';
                    }
                }
            })
            .catch(() => {
                clearInterval(interval);
                document.getElementById('status-text').textContent = 'Ошибка получения статуса.';
            });
        }, 1500);
    }

    // --- Логика для страниц создания/редактирования шаблонов ---
    const addManualRuleBtn = document.getElementById('add-manual-rule');
    const manualRulesContainer = document.getElementById('manual-rules-container');

    if (addManualRuleBtn) {
        addManualRuleBtn.addEventListener('click', function() {
            const ruleRow = document.createElement('div');
            ruleRow.className = 'rule-row';
            // Исправлены имена полей на 'source_cell' и 'template_col'
            ruleRow.innerHTML = `
                <div class="rule-input-group">
                    <label>Из ячейки</label>
                    <input type="text" name="source_cell" placeholder="A1" required>
                </div>
                <div class="rule-arrow">→</div>
                <div class="rule-input-group">
                    <label>В колонку</label>
                    <input type="text" name="template_col" placeholder="B" required>
                </div>
                <button type="button" class="btn btn-danger btn-sm remove-rule-btn" style="align-self: center; margin-top: 1rem;">Удалить</button>
            `;
            manualRulesContainer.appendChild(ruleRow);
        });
    }

    if (manualRulesContainer) {
        manualRulesContainer.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('remove-rule-btn')) {
                e.target.closest('.rule-row').remove();
            }
        });
    }

    // --- Логика для страниц словарей ---
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