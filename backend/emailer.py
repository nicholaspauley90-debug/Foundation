"""Gmail SMTP email service with HTML templates for Foundation Labs."""
import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Dict, Any

logger = logging.getLogger("foundation.email")

GMAIL_USER = os.environ.get("GMAIL_USER", "")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")
GMAIL_FROM_NAME = os.environ.get("GMAIL_FROM_NAME", "Foundation Labs")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")


def _send(to_email: str, subject: str, html: str, text: str = "") -> bool:
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        logger.warning("Gmail not configured, skipping email")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{GMAIL_FROM_NAME} <{GMAIL_USER}>"
        msg["To"] = to_email
        if text:
            msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as smtp:
            smtp.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            smtp.sendmail(GMAIL_USER, [to_email], msg.as_string())
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.exception(f"Email send failed: {e}")
        return False


def _shell(title: str, body_html: str, footer_cta_url: str = "") -> str:
    cta = ""
    if footer_cta_url:
        cta = f"""
            <tr><td align="center" style="padding:24px 0 8px;">
                <a href="{footer_cta_url}" style="display:inline-block;background:#0E0E0D;color:#F5EFE3;padding:14px 28px;text-decoration:none;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;">Visit Foundation</a>
            </td></tr>
        """
    return f"""<!doctype html>
<html><body style="margin:0;padding:0;background:#F5EFE3;font-family:Georgia,serif;color:#0E0E0D;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE3;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FBF8F2;border:1px solid rgba(14,14,13,0.08);">
        <tr><td style="padding:32px 40px 16px;border-bottom:1px solid rgba(14,14,13,0.08);">
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.28em;color:rgba(14,14,13,0.55);">FOUNDATION APPAREL · SKIN LABS</div>
          <div style="font-family:Georgia,serif;font-size:30px;line-height:1.05;margin-top:14px;">{title}</div>
        </td></tr>
        <tr><td style="padding:28px 40px 36px;font-size:15px;line-height:1.7;color:rgba(14,14,13,0.85);">
          {body_html}
        </td></tr>
        {cta}
        <tr><td style="padding:24px 40px;border-top:1px solid rgba(14,14,13,0.08);font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.24em;color:rgba(14,14,13,0.5);text-align:center;">
          THE FOUNDATION OF YOUR DAILY ROUTINE · MADE WITH INTENTION
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


def order_confirmation_html(order: Dict[str, Any]) -> str:
    items_html = ""
    for it in order["items"]:
        items_html += f"""
          <tr>
            <td style="padding:14px 0;border-bottom:1px solid rgba(14,14,13,0.08);">
              <div style="font-family:Georgia,serif;font-size:16px;">{it['title']}</div>
              <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.18em;color:rgba(14,14,13,0.55);margin-top:4px;">{it.get('variant_title','')} · QTY {it['quantity']}</div>
            </td>
            <td align="right" style="padding:14px 0;border-bottom:1px solid rgba(14,14,13,0.08);font-family:Georgia,serif;font-size:15px;white-space:nowrap;">${(it['unit_price']*it['quantity']):.2f}</td>
          </tr>
        """
    addr = order.get("shipping_address") or {}
    body = f"""
      <p style="margin:0 0 14px;">Your Foundation order is in. We'll send tracking once it ships from our print partner.</p>
      <p style="margin:0 0 22px;font-style:italic;color:rgba(14,14,13,0.6);">Order #{order.get('order_id', order['session_id'][-10:].upper())}</p>
      <table width="100%" cellspacing="0" cellpadding="0">{items_html}</table>
      <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;">
        <tr><td style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.18em;color:rgba(14,14,13,0.55);padding:6px 0;">SUBTOTAL</td>
            <td align="right" style="font-family:'Courier New',monospace;font-size:13px;padding:6px 0;">${(order['amount']-order.get('shipping',6.99)):.2f}</td></tr>
        <tr><td style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.18em;color:rgba(14,14,13,0.55);padding:6px 0;">SHIPPING</td>
            <td align="right" style="font-family:'Courier New',monospace;font-size:13px;padding:6px 0;">${order.get('shipping',6.99):.2f}</td></tr>
        <tr><td style="font-family:Georgia,serif;font-size:18px;padding:14px 0;border-top:1px solid rgba(14,14,13,0.15);">Total</td>
            <td align="right" style="font-family:Georgia,serif;font-size:18px;padding:14px 0;border-top:1px solid rgba(14,14,13,0.15);">${order['amount']:.2f}</td></tr>
      </table>
      <div style="margin-top:30px;padding-top:22px;border-top:1px solid rgba(14,14,13,0.08);">
        <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.28em;color:rgba(14,14,13,0.55);">SHIPPING TO</div>
        <div style="margin-top:8px;font-size:14px;line-height:1.6;">
          {addr.get('first_name','')} {addr.get('last_name','')}<br />
          {addr.get('address1','')}{(', '+addr.get('address2','')) if addr.get('address2') else ''}<br />
          {addr.get('city','')}, {addr.get('region','')} {addr.get('zip','')}<br />
          {addr.get('country','')}
        </div>
      </div>
    """
    return _shell("Welcome to Foundation.", body, FRONTEND_URL or "")


def send_order_confirmation(order: Dict[str, Any]) -> bool:
    email = order.get("email")
    if not email:
        return False
    html = order_confirmation_html(order)
    subject = f"Foundation order received · #{order.get('order_id', order['session_id'][-10:].upper())}"
    return _send(email, subject, html)


def abandoned_cart_html(email: str, items: List[Dict[str, Any]], resume_url: str) -> str:
    items_html = ""
    for it in items[:3]:
        img = it.get("image") or ""
        items_html += f"""
          <tr><td style="padding:10px 0;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td width="80" valign="top"><img src="{img}" alt="" width="72" style="display:block;border:0;background:#EBE1CC;" /></td>
              <td valign="top" style="padding-left:14px;">
                <div style="font-family:Georgia,serif;font-size:15px;">{it['title']}</div>
                <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.18em;color:rgba(14,14,13,0.55);margin-top:4px;">{it.get('variant_title','')}</div>
              </td>
            </tr></table>
          </td></tr>
        """
    body = f"""
      <p style="margin:0 0 14px;">You left something at the door.</p>
      <p style="margin:0 0 22px;font-style:italic;color:rgba(14,14,13,0.65);">Your Foundation bag is still here — pick up right where you left off.</p>
      <table width="100%" cellspacing="0" cellpadding="0">{items_html}</table>
    """
    return _shell("Pick up where you left off.", body, resume_url)


def send_abandoned_cart(email: str, items: List[Dict[str, Any]], resume_url: str) -> bool:
    if not email:
        return False
    html = abandoned_cart_html(email, items, resume_url)
    return _send(email, "Your Foundation bag is still waiting", html)
