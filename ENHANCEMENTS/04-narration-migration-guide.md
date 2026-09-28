# Narration Migration and Integration Guide

## 1. Add normalization to `loadLists()`

At the end of `loadLists()`, after the default narration types have been loaded, call:

```javascript
this.normalizeNarrationTypes();
```

This safely converts old narration types to the new shape and adds a required `Payee Name` field to the COD Order Id narration type.

## 2. Add custom-field editing functions

The narration rule editor needs these functions in the `app` object:

```javascript
addNrFieldRow(label = '', type = 'text', options = [], required = true) {
    const box = document.getElementById('nrFieldRows');
    if (!box) return;
    const row = document.createElement('div');
    row.className = 'keypoint-row nr-field-row';
    row.innerHTML = `
        <input type="text" class="nr-field-label" placeholder="Field label" value="${this.escAttr(label)}">
        <select class="nr-field-type">
            <option value="text"${type === 'text' ? ' selected' : ''}>Text</option>
            <option value="select"${type === 'select' ? ' selected' : ''}>Dropdown</option>
        </select>
        <input type="text" class="nr-field-options" placeholder="Options, comma separated" value="${this.escAttr(options.join(', '))}">
        <label><input type="checkbox" class="nr-field-required"${required ? ' checked' : ''}> Required</label>
        <button type="button" class="btn-icon bad" onclick="this.closest('.nr-field-row').remove()">Remove</button>`;
    box.appendChild(row);
},

collectNrFields() {
    return Array.from(document.querySelectorAll('#nrFieldRows .nr-field-row')).map(row => ({
        id: this.newId(),
        label: row.querySelector('.nr-field-label').value.trim(),
        type: row.querySelector('.nr-field-type').value,
        options: row.querySelector('.nr-field-options').value.split(',').map(x => x.trim()).filter(Boolean),
        required: row.querySelector('.nr-field-required').checked
    })).filter(field => field.label);
},
```

## 3. Update narration rule save/edit/reset

In `resetNrForm()`:

```javascript
document.getElementById('nrFieldRows').innerHTML = '';
```

In `editNarrationRule(id)`:

```javascript
document.getElementById('nrFieldRows').innerHTML = '';
(nr.fields || []).forEach(field => this.addNrFieldRow(
    field.label,
    field.type || 'text',
    field.options || [],
    field.required !== false
));
```

In `saveNarrationRule()`:

```javascript
const fields = this.collectNrFields();
// For an existing narration type:
nr.fields = fields;
// For a new narration type:
this.lists.narrationTypes.push({ id: this.newId(), name, hasPercent, phrase, docLabel, fields });
```

## 4. Update `saveTask()` narration data

The replacement `collectNarration()` stores both `fieldValues` and `subCategoryFields`. Keep this object in the task payload:

```javascript
narration: this.collectNarration(),
subCategoryFields: this.collectSubCategoryFields(),
```

## 5. Daily Activity Report behavior

The enhanced `reportDetailsFor()` returns:

```text
Payee Name: Being Amount Paid twds COD Charges Against Order Id: ORD-12345
```

`logTaskActivity()` already sends `reportDetailsFor(task)` as the activity details, so the existing daily-report backend can display this formatted text without a separate report API change.

## 6. Compatibility notes

- Existing tasks without `narration.fieldValues` continue to work.
- Existing narration types without `fields` are treated as having no custom fields.
- Existing completed tasks are not rewritten automatically.
- Required custom fields are validated only when a narration type is selected.
- The Payee Name field is required only for narration types configured with that field.
