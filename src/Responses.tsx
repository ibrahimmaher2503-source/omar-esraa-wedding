import React, { useRef, useState } from 'react';

async function saveResponse(data: object) {
  const response = await fetch('/api/responses', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data), signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(response.status === 429 ? 'Please wait a few minutes before trying again.' : 'Your reply was not saved. Please try again.');
}

export function GuestResponses() {
  const [name, setName] = useState('');
  return <><Attendance name={name} onNameChange={setName}/><div id="guestbook"><Guestbook name={name}/></div></>;
}

function Attendance({ name: guestName, onNameChange }: { name: string; onNameChange: (name: string) => void }) {
  const [choice, setChoice] = useState('');
  const [status, setStatus] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const id = useRef('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const name = guestName.trim();
    if (!name || !choice) { setStatus('Please enter your name and select a response.'); return; }
    setBusy(true); setStatus('Sending your reply…');
    id.current ||= crypto.randomUUID();
    try {
      await saveResponse({ id: id.current, kind: 'rsvp', name, attending: choice === 'yes' });
      setSaved(true); setStatus('');
    } catch (error) { setStatus(error instanceof Error && error.message.startsWith('Please wait') ? error.message : 'Your reply could not be confirmed. Please check your connection and try again.'); }
    finally { setBusy(false); }
  }
  return <section className="guestbook attendance">
    <p className="section-number">V</p><h2>YOUR PRESENCE IS REQUESTED</h2>
    <p className="invite-text">Will you join us for our wedding celebration?<br/>We would be delighted to share this day with you.</p>
    <label htmlFor="guest-name">Your name</label><input name="name" id="guest-name" form={saved ? undefined : 'attendance-form'} value={guestName} onChange={e => onNameChange(e.target.value)} required maxLength={80} autoComplete="name" aria-describedby="shared-name-note" disabled={busy}/>
    <p id="shared-name-note" className="local-note">Used for your attendance reply and wishes.</p>
    {saved ? <div className="reply-success" role="status"><span>O · E</span><h3>Reply Sent ✓</h3><p>Your response has been sent to Omar & Esraa.</p><p>Thank you for being part of our story.</p><a className="calendar-link" href="#guestbook">Continue to the Guestbook →</a></div> :
      <form id="attendance-form" onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy}><legend>Will you join us?</legend>
          <label className={'response-option ' + (choice === 'yes' ? 'selected' : '')}><input type="radio" name="attendance" value="yes" required checked={choice === 'yes'} onChange={() => setChoice('yes')}/><span><b>Yes, I’ll Be There!</b><small>I look forward to celebrating with you.</small></span></label>
          <label className={'response-option ' + (choice === 'no' ? 'selected' : '')}><input type="radio" name="attendance" value="no" checked={choice === 'no'} onChange={() => setChoice('no')}/><span><b>Sorry, I Can’t Attend</b><small>Sending you my warmest wishes.</small></span></label>
        </fieldset>
        <button className="pill" disabled={busy}>{busy ? 'Sending your reply…' : 'Confirm My Reply'}</button><p className="status" role="status">{status}</p>
      </form>}
    <p className="local-note">Your reply is shared privately with Omar & Esraa.</p>
  </section>;
}

function Guestbook({ name: guestName }: { name: string }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const id = useRef('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget, data = new FormData(form);
    const name = guestName.trim(), message = String(data.get('message') || '').trim();
    if (!name) { setStatus('Please add your name above before sending your wishes.'); document.getElementById('guest-name')?.focus(); return; }
    if (!message) { setStatus('Please enter a wish.'); return; }
    setBusy(true); setStatus('Sending your wishes…');
    id.current ||= crypto.randomUUID();
    try {
      await saveResponse({ id: id.current, kind: 'wish', name, message });
      id.current = ''; form.reset(); setStatus('Message Sent ✓ Thank you! Your wishes have been sent to Omar & Esraa.');
    } catch (error) { setStatus(error instanceof Error && error.message.startsWith('Please wait') ? error.message : 'Your message could not be confirmed. Please check your connection and try again.'); }
    finally { setBusy(false); }
  }
  return <section className="guestbook">
    <p className="section-number">VI</p><h2>LEAVE YOUR WISHES</h2>
    <p className="invite-text">Leave a message for Omar & Esraa<br/>as they begin their life together.</p><p>Your kind words will make this day even more special.</p>
    <div className="ornament" aria-hidden="true"><span/>❦<span/></div>
    <form onSubmit={submit} aria-busy={busy}>
      <p>{guestName.trim() ? <>Sending as <strong>{guestName.trim()}</strong> · <a href="#guest-name">Change name</a></> : <a href="#guest-name">Add your name above</a>}</p>
      <label htmlFor="guest-message">Your message to Omar & Esraa</label><textarea id="guest-message" name="message" placeholder="Write your message to Omar & Esraa…" required maxLength={500} rows={4} disabled={busy}/>
      <button className="pill" disabled={busy}>{busy ? 'Sending your wishes…' : 'Send Your Wishes'}</button><p role="status" className="status">{status}</p>
    </form><p className="local-note">Your message is shared privately with Omar & Esraa.</p>
  </section>;
}
