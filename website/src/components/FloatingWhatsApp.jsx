import { FaWhatsapp } from "react-icons/fa";

export default function FloatingWhatsApp() {
  const phone = "919142025447";
  const message = encodeURIComponent(
    "Hello Software Native Team! I am interested in LMS for my study library. Please provide a free live demo and pricing details."
  );
  const waUrl = `https://wa.me/${phone}?text=${message}`;

  return (
    <div className="whatsapp-floating">
      <div className="whatsapp-bubble">
        💬 Need a Free Demo? Chat with us!
      </div>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-btn-circle"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
      >
        <FaWhatsapp />
      </a>
    </div>
  );
}
