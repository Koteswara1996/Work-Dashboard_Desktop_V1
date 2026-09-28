# Narration Enhancement Checklist

- [ ] Add `ENHANCEMENTS/02-narration-function-replacements.js` functions to `app.js`.
- [ ] Call `normalizeNarrationTypes()` from `loadLists()`.
- [ ] Add `narrationCustomFields` to `index.html`.
- [ ] Add custom-field controls to the narration rule editor.
- [ ] Add `addNrFieldRow()` and `collectNrFields()`.
- [ ] Update narration rule save/edit/reset handlers.
- [ ] Ensure `saveTask()` stores `subCategoryFields` and the enhanced narration object.
- [ ] Test COD Charges against Order Id with a required Payee Name.
- [ ] Test a narration type with optional and required custom fields.
- [ ] Test sub-category fields appearing in narration preview and final text.
- [ ] Complete a task and verify the daily report begins with `Payee Name:`.
- [ ] Test old tasks and old narration types for backward compatibility.
