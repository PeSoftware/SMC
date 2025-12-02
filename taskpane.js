
// /save-email/taskpane.js
Office.onReady((info) => {
  if (info.host === Office.HostType.Outlook) {
    console.log("Office Add-in loaded in Outlook");
  }
});

async function getContext() {
  const item = Office.context.mailbox.item;
  const token = await OfficeRuntime.auth.getAccessToken({ allowSignInPrompt: true });
  return { token, itemId: item.itemId, subject: item.subject };
}

let debounce;
document.getElementById('txtSearch').addEventListener('input', e => {
  clearTimeout(debounce);
  const term = e.target.value;
  debounce = setTimeout(async () => {
    const { token } = await getContext();
    const res = await fetch("https://<flow>/SearchBookings", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ q: term })
    });
    const rows = await res.json();
    render(rows);
  }, 250);
});

function render(rows) {
  const el = document.getElementById('results');
  el.innerHTML = rows.map(r => `
    <button onclick="save('${r.bookingId}')">
      ${r.bookingId} — ${r.surname}, ${r.firstName} — ${r.reportType} — ${r.aptDateTime}
    </button>`).join('');
}

async function save(bookingId) {
  const { token, itemId, subject } = await getContext();
  const moveToBooked = document.getElementById('chkMove').checked;
  const res = await fetch("https://<flow>/SaveEmailToBooking", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, messageId: itemId, subject, moveToBooked })
  });
  const out = await res.json();
  Office.UI.displayDialogAsync(out.folderLink || out.fileLink); // simple confirmation
}
