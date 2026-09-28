# Narration UI Enhancement

Add the following markup inside the existing `#narrationFieldsWrap` in `index.html`, after the standard narration fields and before the preview.

```html
<div id="narrationCustomFields" class="conditional-fields" aria-live="polite"></div>
```

Add this CSS to the existing stylesheet section if the dynamic fields do not already inherit the form styling:

```css
#narrationCustomFields {
    display: grid;
    gap: 10px;
    margin-top: 10px;
}

.narration-custom-field label {
    display: block;
    margin-bottom: 5px;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--label-2);
}

.narration-custom-input {
    width: 100%;
    box-sizing: border-box;
}
```

## Manage Narration Types fields

Add these controls to the existing narration-rule form near `nrDocLabel`:

```html
<div class="form-group">
    <label>Custom Fields</label>
    <div id="nrFieldRows"></div>
    <button type="button" class="btn-row" onclick="app.addNrFieldRow()">+ Add Field</button>
    <small>Use this for fields such as Payee Name, Order ID, Route, or Payment Method.</small>
</div>
```

Each row should contain:

```html
<div class="keypoint-row nr-field-row">
    <input type="text" class="nr-field-label" placeholder="Field label">
    <select class="nr-field-type">
        <option value="text">Text</option>
        <option value="select">Dropdown</option>
    </select>
    <input type="text" class="nr-field-options" placeholder="Options, comma separated">
    <label><input type="checkbox" class="nr-field-required" checked> Required</label>
    <button type="button" class="btn-icon bad" onclick="this.closest('.nr-field-row').remove()">Remove</button>
</div>
```

When the existing preview inputs change, call:

```javascript
app.updateNarrationPreview();
```

When `taskSubCategory` changes, call both:

```javascript
app.renderSubCategoryFields(app.collectSubCategoryFields());
app.updateNarrationPreview();
```
