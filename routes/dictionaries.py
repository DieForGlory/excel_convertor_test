# /routes/dictionaries.py
from flask import Blueprint, render_template, request, redirect, url_for

# Локальные импорты
import value_dictionary_handler
import dictionary_matcher

dictionaries_bp = Blueprint('dictionaries', __name__)

@dictionaries_bp.route('/value-dictionary')
def value_dictionary_ui():
    rules = value_dictionary_handler.load_dictionary()
    return render_template('value_dictionary.html', rules=rules)

@dictionaries_bp.route('/value-dictionary/add', methods=['POST'])
def add_to_value_dictionary():
    canonical_word = request.form.get('canonical_word')
    find_words = request.form.get('find_words')
    if canonical_word and find_words:
        value_dictionary_handler.add_entry(canonical_word, find_words)
    return redirect(url_for('dictionaries.value_dictionary_ui'))

@dictionaries_bp.route('/value-dictionary/delete', methods=['POST'])
def delete_from_value_dictionary():
    canonical_word = request.form.get('canonical_word')
    if canonical_word:
        value_dictionary_handler.delete_entry(canonical_word)
    return redirect(url_for('dictionaries.value_dictionary_ui'))

@dictionaries_bp.route('/dictionary')
def dictionary_ui():
    return render_template('dictionary.html', dictionary=dictionary_matcher.load_dictionary())

@dictionaries_bp.route('/dictionary/add', methods=['POST'])
def add_to_dictionary():
    canonical_name = request.form.get('canonical_name')
    synonyms = request.form.get('synonyms', '')
    if canonical_name:
        dictionary_matcher.add_entry(canonical_name, synonyms)
    return redirect(url_for('dictionaries.dictionary_ui'))

@dictionaries_bp.route('/dictionary/delete', methods=['POST'])
def delete_from_dictionary():
    canonical_name = request.form.get('canonical_name')
    if canonical_name:
        dictionary_matcher.delete_entry(canonical_name)
    return redirect(url_for('dictionaries.dictionary_ui'))