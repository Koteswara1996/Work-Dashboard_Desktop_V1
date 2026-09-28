/*
 * COD narration enhancement
 *
 * Load this file after app.js (for example, immediately after the app.js
 * script tag in index.html). It adds the two required fields to both COD
 * narration types and applies the special Daily Activity Report format.
 */
(function () {
    const COD_TYPES = /cod\s+charges?\s+against\s+(order\s*id|po)\b/i;

    function isCodNarration(nr) {
        return !!nr && COD_TYPES.test(String(nr.name || ''));
    }

    function getSelectedType() {
        const select = document.getElementById('taskNarrationType');
        return (app.lists.narrationTypes || []).find(nr => nr.name === (select && select.value));
    }

    function ensureCodFields() {
        if (!Array.isArray(app.lists.narrationTypes)) app.lists.narrationTypes = [];
        let changed = false;
        app.lists.narrationTypes.forEach(nr => {
            if (!isCodNarration(nr)) return;
            if (!Array.isArray(nr.fields)) nr.fields = [];
            const labels = nr.fields.map(f => String(f.label || '').toLowerCase());
            if (!labels.some(label => /vendor\s*name|vendor/.test(label))) {
                nr.fields.unshift({ id: app.newId(), label: 'Vendor Name', required: true, type: 'text', options: [] });
                changed = true;
            }
            if (!labels.some(label => /order\s*id|po\s*(no|number)?/.test(label))) {
                nr.fields.push({ id: app.newId(), label: 'Order Id', required: true, type: 'text', options: [] });
                changed = true;
            }
        });
        return changed;
    }

    function fieldValues() {
        const box = document.getElementById('codNarrationFields');
        const values = {};
        if (box) box.querySelectorAll('[data-cod-label]').forEach(el => {
            const value = String(el.value || '').trim();
            if (value) values[el.dataset.codLabel] = value;
        });
        return values;
    }

    function renderFields(values) {
        const current = getSelectedType();
        let box = document.getElementById('codNarrationFields');
        const docInput = document.getElementById('narrationDocNo');
        const docGroup = docInput && docInput.closest('.form-group');

        if (!current || !isCodNarration(current)) {
            if (box) box.remove();
            if (docGroup) docGroup.style.display = '';
            return;
        }

        if (!box) {
            box = document.createElement('div');
            box.id = 'codNarrationFields';
            const purpose = document.getElementById('narrationPurpose');
            const purposeGroup = purpose && purpose.closest('.form-group');
            (purposeGroup || docInput && docInput.parentElement || document.getElementById('narrationFieldsWrap'))
                .parentElement.appendChild(box);
        }
        const old = values || {};
        const fields = Array.isArray(current.fields) ? current.fields : [];
        box.innerHTML = fields.map(field => {
            const label = String(field.label || '').trim();
            if (!label) return '';
            const value = old[label] || ( /order\s*id|po\s*(no|number)?/i.test(label)
                ? (old['Order Id'] || document.getElementById('narrationDocNo')?.value || '') : '');
            return '<div class="form-group"><label>' + app.sanitize(label) + '</label>' +
                '<input type="text" autocomplete="off" data-cod-label="' + app.escAttr(label) +
                '" value="' + app.escAttr(value) + '" oninput="app.updateNarrationPreview()"></div>';
        }).join('');
        if (docGroup) docGroup.style.display = 'none';
    }

    const originalLoadLists = app.loadLists;
    app.loadLists = function () {
        originalLoadLists.apply(this, arguments);
        const changed = ensureCodFields();
        if (changed) this.saveLists(false);
    };

    const originalNarrationChange = app.onNarrationTypeChange;
    app.onNarrationTypeChange = function () {
        originalNarrationChange.apply(this, arguments);
        renderFields();
    };

    const originalRenderNarration = app.renderNarrationFields;
    app.renderNarrationFields = function (narration) {
        originalRenderNarration.apply(this, arguments);
        renderFields(narration && narration.fieldValues || {});
    };

    const originalCollectNarration = app.collectNarration;
    app.collectNarration = function () {
        const result = originalCollectNarration.apply(this, arguments);
        if (!result) return result;
        const nr = (this.lists.narrationTypes || []).find(x => x.id === result.typeId);
        if (isCodNarration(nr)) {
            result.fieldValues = fieldValues();
            result.vendorName = result.fieldValues['Vendor Name'] || '';
            result.docNo = result.fieldValues['Order Id'] || result.docNo;
            result.text = this.buildNarrationText(nr, result.percent, result.docNo, result.purpose, '');
        }
        return result;
    };

    const originalReportDetails = app.reportDetailsFor;
    app.reportDetailsFor = function (task, fallback) {
        const narration = task && task.narration;
        const nr = narration && (this.lists.narrationTypes || []).find(x =>
            x.id === narration.typeId || x.name === narration.typeName);
        if (isCodNarration(nr)) {
            const values = narration.fieldValues || {};
            const vendor = narration.vendorName || values['Vendor Name'] || '';
            const text = narration.text || '';
            return vendor && text ? String(vendor).trim() + ': ' + text : text;
        }
        return originalReportDetails.apply(this, arguments);
    };
})();
