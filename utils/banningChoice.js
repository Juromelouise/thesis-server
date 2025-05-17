exports.banningChoice = (reason, fileUrl, endDate) => {
  let text = "";
  let html = "";
  const supportEmail = "support@yourdomain.com";
  const durationText = endDate
    ? ` The ban will be lifted on: ${endDate}.`
    : "";

  switch (reason) {
    case "Submitting false or misleading reports":
      text = `Your account has been banned for submitting false or misleading reports.${durationText} If you believe this is a mistake, please contact support at ${supportEmail}.`;
      html = `
        <h2 style="color:#ff4d4f;">Account Banned</h2>
        <p>You have been banned for <b>submitting false or misleading reports</b>.</p>
        <p><b>Ban Duration:</b> ${endDate ? endDate : "Indefinite"}</p>
        ${fileUrl ? `<p>See the attached file for more details.</p>` : ""}
        <p>If you believe this is a mistake, please contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
      `;
      break;
    case "Using inappropriate or offensive language in comments":
      text = `Your account has been banned for using inappropriate or offensive language in comments.${durationText} If you believe this is a mistake, please contact support at ${supportEmail}.`;
      html = `
        <h2 style="color:#ff4d4f;">Account Banned</h2>
        <p>You have been banned for <b>using inappropriate or offensive language in comments</b>.</p>
        <p><b>Ban Duration:</b> ${endDate ? endDate : "Indefinite"}</p>
        ${fileUrl ? `<p>See the attached file for more details.</p>` : ""}
        <p>If you believe this is a mistake, please contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
      `;
      break;
    case "Violating terms and agreements":
      text = `Your account has been banned for violating terms and agreements.${durationText} If you believe this is a mistake, please contact support at ${supportEmail}.`;
      html = `
        <h2 style="color:#ff4d4f;">Account Banned</h2>
        <p>You have been banned for <b>violating terms and agreements</b>.</p>
        <p><b>Ban Duration:</b> ${endDate ? endDate : "Indefinite"}</p>
        ${fileUrl ? `<p>See the attached file for more details.</p>` : ""}
        <p>If you believe this is a mistake, please contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
      `;
      break;
    case "Spam or irrelevant content":
      text = `Your account has been banned for spam or irrelevant content.${durationText} If you believe this is a mistake, please contact support at ${supportEmail}.`;
      html = `
        <h2 style="color:#ff4d4f;">Account Banned</h2>
        <p>You have been banned for <b>spam or irrelevant content</b>.</p>
        <p><b>Ban Duration:</b> ${endDate ? endDate : "Indefinite"}</p>
        ${fileUrl ? `<p>See the attached file for more details.</p>` : ""}
        <p>If you believe this is a mistake, please contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
      `;
      break;
    default:
      text = `Your account has been banned for other reasons.${durationText} If you believe this is a mistake, please contact support at ${supportEmail}.`;
      html = `
        <h2 style="color:#ff4d4f;">Account Banned</h2>
        <p>You have been banned for other reasons.</p>
        <p><b>Ban Duration:</b> ${endDate ? endDate : "Indefinite"}</p>
        ${fileUrl ? `<p>See the attached file for more details.</p>` : ""}
        <p>If you believe this is a mistake, please contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
      `;
  }
  return { text, html };
};