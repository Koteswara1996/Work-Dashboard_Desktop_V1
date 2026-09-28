/*
 * Narration enhancement replacements for app.js
 *
 * Copy the functions below into the app object in app.js. These snippets are
 * intentionally isolated so they can be reviewed before being merged into the
 * production application.
 */

/* ---------- NARRATION TYPE NORMALIZATION ---------- */
normalizeNarrationTypes() {
    if (!Array.isArray(this.lists.narrationTypes)) this.lists.narrationTypes = [];

    this.lists.narrationTypes = this.lists.narrationTypes.map(nr => {
        const fields = Array.isArray(nr.fields) ? nr.fields : [];
        return Object.assign({}, nr, {
            fields: fields.map(field => ({
                id: field.id || this.newId(),
                label: String(field.label || '').trim(),
                required: field.required !== false,
                type: field.type === 'select' ? 'select' : 'text',
                options: Array.isArray(field.options) ? field.options.filter(Boolean) : []
            })).filter(field => field.label)
        });
    });

    // Existing profiles receive the COD Payee Name field once. Users can edit
    // or remove it from Manage Narration Types afterwards.
    const cod = this.lists.narrationTypes.find(nr => /cod\s+charges?\s+against\s+order/i.test(nr.name || ''));
    if (cod && !cod.fields.some(field => /payee\s*name/i.test(field.label))) {
        cod.fields.unshift({
            id: this.newId(),
            label: 'Payee Name',
            required: true,
            type: 'text',
            options: []
        });
    }
},

/* Call this at the end of loadLists(), after narrationTypes is initialized. */

/* ---------- NARRATION FIELD HELPERS ---------- */
getSelectedNarrationType() {
    const name = document.getElementById('taskNarrationType')?.value || '';
    return (this.lists.narrationTypes || []).find(nr => nr.name === name) || null;
},

renderNarrationCustomFields(values = {}) {
    const box = document.getElementById('narrationCustomFields');
    if (!box) return;
    box.innerHTML = '';

    const nr = this.getSelectedNarrationType();
    if (!nr || !Array.isArray(nr.fields) || !nr.fields.length) return;

    nr.fields.forEach(field => {
        const row = document.createElement('div');
        row.className = 'form-group narration-custom-field';
        const value = values[field.label] || '';
        const required = field.required !== false;
        const label = `${this.sanitize(field.label)}${required ? ' *' : ''}`;

        if (field.type === 'select' && field.options.length) {
            row.innerHTML = `<label>${label}</label>
                <select class="narration-custom-input"
                        data-label="${this.escAttr(field.label)}"
                        data-required="${required}">
                    <option value="">Select ${this.sanitize(field.label)}</option>
                    ${field.options.map(option => `<option value="${this.escAttr(option)}"${option === value ? ' selected' : ''}>${this.sanitize(option)}</option>`).join('')}
                </select>`;
        } else {
            row.innerHTML = `<label>${label}</label>
                <input type="text"
                       class="narration-custom-input"
                       data-label="${this.escAttr(field.label)}"
                       data-required="${required}"
                       value="${this.escAttr(value)}"
                       placeholder="Enter ${this.escAttr(field.label)}">`;
        }
        box.appendChild(row);
    });
},

collectNarrationCustomFields() {
    const box = document.getElementById('narrationCustomFields');
    if (!box) return {};
    const values = {};
    box.querySelectorAll('.narration-custom-input').forEach(input => {
        const value = String(input.value || '').trim();
        if (value) values[input.dataset.label] = value;
    });
    return values;
},

/* ---------- UPDATED NARRATION TYPE CHANGE ---------- */
onNarrationTypeChange() {
    const nr = this.getSelectedNarrationType();
    const wrap = document.getElementById('narrationFieldsWrap');
    const pctGroup = document.getElementById('narrationPercentGroup');
    const docLabel = document.getElementById('narrationDocLabel');
    const docInput = document.getElementById('narrationDocNo');

    if (wrap) wrap.style.display = nr ? '' : 'none';
    if (pctGroup) pctGroup.style.display = nr && nr.hasPercent ? '' : 'none';
    if (docLabel) docLabel.textContent = nr ? nr.docLabel : 'Document No';
    if (docInput) docInput.placeholder = nr ? `e.g. ${nr.docLabel}` : '';

    this.renderNarrationCustomFields();
    this.updateNarrationPreview();
},

/* ---------- UPDATED NARRATION BUILDER ---------- */
buildNarrationText(nr, percent, docNo, purpose, mailChain, customFields = {}, subCategoryFields = {}) {
    if (!nr) return '';

    let text = 'Being ';
    if (nr.hasPercent && String(percent || '').trim()) text += `${String(percent).trim()}% `;
    text += nr.phrase || '';
    text += String(docNo || '').trim();

    // Custom narration fields are appended in the order configured by the user.
    const customParts = (nr.fields || [])
        .map(field => customFields[field.label])
        .filter(value => String(value || '').trim())
        .map(value => String(value).trim());
    if (customParts.length) text += ` ${customParts.join(' ')}`;

    // Sub-category fields provide additional context without changing the
    // existing narration template. For example: PO Number: PO-123.
    const subParts = Object.keys(subCategoryFields || {})
        .map(label => `${label}: ${subCategoryFields[label]}`)
        .filter(Boolean);
    if (subParts.length) text += ` ${subParts.join(', ')}`;

    if (String(purpose || '').trim()) text += ` ${String(purpose).trim()}`;
    if (String(mailChain || '').trim()) text += ` ${String(mailChain).trim()}`;
    return text.replace(/\s+/g, ' ').trim();
},

/* ---------- UPDATED PREVIEW / COLLECTION ---------- */
updateNarrationPreview() {
    const preview = document.getElementById('narrationPreview');
    if (!preview) return;
    const nr = this.getSelectedNarrationType();
    const mailChain = document.getElementById('taskMailChain')?.value || '';
    preview.value = nr ? this.buildNarrationText(
        nr,
        document.getElementById('narrationPercent')?.value || '',
        document.getElementById('narrationDocNo')?.value || '',
        document.getElementById('narrationPurpose')?.value || '',
        mailChain,
        this.collectNarrationCustomFields(),
        this.collectSubCategoryFields()
    ) : '';
},

collectNarration() {
    const nr = this.getSelectedNarrationType();
    if (!nr) return null;

    const percent = document.getElementById('narrationPercent')?.value.trim() || '';
    const docNo = document.getElementById('narrationDocNo')?.value.trim() || '';
    const purpose = document.getElementById('narrationPurpose')?.value.trim() || '';
    const mailChain = document.getElementById('taskMailChain')?.value.trim() || '';
    const fieldValues = this.collectNarrationCustomFields();
    const subCategoryFields = this.collectSubCategoryFields();

    return {
        typeId: nr.id,
        typeName: nr.name,
        percent,
        docNo,
        purpose,
        fieldValues,
        subCategoryFields,
        payeeName: Object.keys(fieldValues).find(label => /payee\s*name/i.test(label))
            ? fieldValues[Object.keys(fieldValues).find(label => /payee\s*name/i.test(label))]
            : '',
        text: this.buildNarrationText(nr, percent, docNo, purpose, mailChain, fieldValues, subCategoryFields)
    };
},

renderNarrationFields(narration) {
    this.setSelectValue('taskNarrationType', narration ? narration.typeName : '');
    this.onNarrationTypeChange();
    document.getElementById('narrationPercent').value = narration?.percent || '';
    document.getElementById('narrationDocNo').value = narration?.docNo || '';
    document.getElementById('narrationPurpose').value = narration?.purpose || '';
    this.renderNarrationCustomFields(narration?.fieldValues || {});
    this.updateNarrationPreview();
},

/* ---------- UPDATED DAILY REPORT DETAILS ---------- */
reportDetailsFor(task, fallback) {
    if (!task) return fallback || '';

    const narration = task.narration;
    const text = narration?.text || task.notes || fallback || '';
    const payee = narration?.payeeName || Object.entries(narration?.fieldValues || {})
        .find(([label, value]) => /payee\s*name/i.test(label) && String(value).trim())?.[1] || '';

    return payee ? `${String(payee).trim()}: ${text}` : text;
},

/* ---------- UPDATED VALIDATION ---------- */
validatePaymentDetails(fields) {
    if (this.isImportPaymentCategory(fields.category) && String(fields.status).trim().toLowerCase() === 'in progress') {
        const pd = this.collectPaymentDetails();
        if (!pd.paymentPercent || !pd.paymentType || !pd.paymentAgainst) {
            return 'Import Payment marked In Progress needs Payment %, Payment Type, and Payment Against.';
        }
    }

    if (this.categoryHasSubCategory(fields.category) && String(fields.status).trim().toLowerCase() === 'completed') {
        if (!fields.subCategory) return 'Select a Sub Category before marking this Completed.';
        const sc = (this.lists.subCategories || []).find(x => x.name === fields.subCategory);
        const missingSub = (sc?.fields || []).filter(field => !String((fields.subCategoryFields || {})[field.label] || '').trim());
        if (missingSub.length) return `Fill in ${missingSub.map(field => field.label).join(', ')} before marking this Completed.`;
    }

    if (fields.narration) {
        const nr = (this.lists.narrationTypes || []).find(x => x.id === fields.narration.typeId);
        if (!fields.narration.docNo) return `Enter the ${(nr && nr.docLabel) || 'document number'} for the Tally Narration, or clear the Narration Type.`;
        if (nr?.hasPercent && !fields.narration.percent) return 'Enter the % for the Tally Narration.';

        const missing = (nr?.fields || []).filter(field =>
            field.required !== false && !String((fields.narration.fieldValues || {})[field.label] || '').trim()
        );
        if (missing.length) return `Fill in ${missing.map(field => field.label).join(', ')} for the Tally Narration.`;
    }
    return '';
},
