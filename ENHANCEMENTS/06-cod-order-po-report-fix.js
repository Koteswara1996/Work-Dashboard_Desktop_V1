/*
 * COD Charges against Order Id / PO fix
 *
 * Drop this snippet into app.js after the existing narration helpers,
 * or load it as a final enhancement file after app.js in the page.
 *
 * Required behavior:
 *   - COD Charges against Order Id and COD Charges against PO both get
 *     default custom fields: Vendor Name + Order Id
 *   - Daily report line uses: "Vendor: narration text without mail-chain"
 */

const COD_PO_TYPE_NAMES = [
    'COD Charges against Order Id',
    'COD Charges against PO'
];

function ensureCodOrderNarrationDefaults() {
    if (!Array.isArray(this.lists.narrationTypes)) this.lists.narrationTypes = [];

    const addCustomFields = (nr) => {
        if (!nr || typeof nr !== 'object') return nr;
        const labels = (nr.fields || []).map(f => String(f.label || '').trim());
        const hasVendor = labels.some(label => /vendor\s*name|payee\s*name/i.test(label));
        const hasOrder = labels.some(label => /order\s*id|order\s*no|order\s*number/i.test(label));

        const fields = Array.isArray(nr.fields) ? nr.fields.slice() : [];
        if (!hasVendor) {
            fields.unshift({
                id: this.newId(),
                label: 'Vendor Name',
                required: true,
                type: 'text',
                options: []
            });
        }
        if (!hasOrder) {
            fields.push({
                id: this.newId(),
                label: 'Order Id',
                required: true,
                type: 'text',
                options: []
            });
        }

        nr.fields = fields;
        return nr;
    };

    this.lists.narrationTypes = this.lists.narrationTypes.map(nr => {
        const name = String(nr && nr.name || '');
        if (COD_PO_TYPE_NAMES.some(type => new RegExp('^' + type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i').test(name))) {
            return addCustomFields(nr);
        }
        return nr;
    });

    COD_PO_TYPE_NAMES.forEach(typeName => {
        const exists = this.lists.narrationTypes.some(nr => String(nr && nr.name || '').toLowerCase() === typeName.toLowerCase());
        if (!exists) {
            this.lists.narrationTypes.push({
                id: this.newId(),
                name: typeName,
                hasPercent: false,
                phrase: typeName === 'COD Charges against PO'
                    ? 'Amount Paid twds COD Charges Against PO: '
                    : 'Amount Paid twds COD Charges Against Order Id: ',
                docLabel: 'Order Id',
                fields: [
                    { id: this.newId(), label: 'Vendor Name', required: true, type: 'text', options: [] },
                    { id: this.newId(), label: 'Order Id', required: true, type: 'text', options: [] }
                ]
            });
        }
    });
}

function stripMailChainFromNarrationText(text) {
    if (!text) return '';
    return String(text)
        .replace(/\s*(?:[-–—:]\s*)?(?:Mail\s*Chain|Reference|Chain\s*Main)\s*[:\-–—]?\s*.*$/i, '')
        .trim();
}

function getNarrationVendorName(narration) {
    if (!narration) return '';

    const fieldValues = narration.fieldValues || {};
    const labels = Object.keys(fieldValues);
    const vendorKey = labels.find(label => /vendor\s*name|payee\s*name/i.test(label));
    if (vendorKey) return String(fieldValues[vendorKey] || '').trim();

    if (narration.payeeName) return String(narration.payeeName).trim();
    return '';
}

function shouldUseVendorReportFormat(narration) {
    if (!narration) return false;
    const name = String(narration.typeName || narration.type || '').trim();
    return COD_PO_TYPE_NAMES.some(type => new RegExp('^' + type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i').test(name));
}

function reportDetailsFor(task, fallback) {
    if (!task) return fallback || '';

    const narration = task.narration;
    const rawText = narration?.text || task.notes || fallback || '';
    const cleanedText = stripMailChainFromNarrationText(rawText);

    if (shouldUseVendorReportFormat(narration)) {
        const vendor = getNarrationVendorName(narration);
        return vendor ? `${vendor}: ${cleanedText}` : cleanedText;
    }

    const payee = narration?.payeeName || Object.entries(narration?.fieldValues || {})
        .find(([label, value]) => /payee\s*name/i.test(label) && String(value).trim())?.[1] || '';

    return payee ? `${String(payee).trim()}: ${cleanedText}` : cleanedText;
}

/*
 * Optional override for buildNarrationText:
 * keep the string clean for COD order / PO tasks and never append the mail chain
 * to the report text for these narration types.
 */
function buildNarrationTextForCodTypes(nr, percent, docNo, purpose, mailChain, fieldValues, subCategoryFields) {
    const typeName = String(nr && nr.name || '');
    const isCodPoNarration = COD_PO_TYPE_NAMES.some(type => new RegExp('^' + type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i').test(typeName));

    const text = this.buildNarrationText ? this.buildNarrationText.call(this, nr, percent, docNo, purpose, mailChain, fieldValues, subCategoryFields) : '';
    if (!isCodPoNarration) return text;

    const vendor = fieldValues && (fieldValues['Vendor Name'] || fieldValues['Payee Name']);
    const orderId = fieldValues && (fieldValues['Order Id'] || fieldValues['Order No'] || fieldValues['Order Number']);
    const base = String(text || '').replace(/\s*(?:[-–—:]\s*)?(?:Mail\s*Chain|Reference|Chain\s*Main)\s*[:\-–—]?\s*.*$/i, '').trim();

    if (vendor && orderId && base && !base.match(new RegExp(orderId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))) {
        return `${base} ${String(orderId).trim()}`;
    }

    return base;
}

/*
 * Call this once from loadLists() after narrationTypes are initialized:
 * this.ensureCodOrderNarrationDefaults();
 */
