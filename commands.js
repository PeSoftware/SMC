
// /save-email/commands.js
export function onShowSaveEmail(event) {
  Office.addin.showTaskPane().then(() => event.completed());
}
