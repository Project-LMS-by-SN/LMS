import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaExclamationTriangle, FaCrown, FaTimes } from "react-icons/fa";

const ExpiryModal = () => {
  const [show, setShow] = useState(false);
  const [daysLeft, setDaysLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const user = (() => {
      try { return JSON.parse(localStorage.getItem("lms_user") || "{}"); }
      catch { return {}; }
    })();

    if (!user || !user.subscriptionTier || user.subscriptionTier === "FREE") return;
    if (!user.subscriptionExpiry) return;

    const expiry = new Date(user.subscriptionExpiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diff <= 7) {
      setDaysLeft(diff);
      setIsExpired(diff <= 0);
      setShow(true);
    }
  }, []);

  const getRolePrefix = () => {
    const user = (() => {
      try { return JSON.parse(localStorage.getItem("lms_user") || "{}"); }
      catch { return {}; }
    })();
    if (!user || !user.role) return "";
    const roleSegment = user.role.toLowerCase();
    const nameSegment = (user.name || "user").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `/${roleSegment}/${nameSegment}`;
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '20px', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '0',
        width: '100%', maxWidth: '420px', overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'fadeIn 0.3s ease-out'
      }}>
        <div style={{
          background: isExpired ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #d97706, #b45309)',
          padding: '32px 24px', textAlign: 'center'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#fff'
          }}>
            <FaExclamationTriangle />
          </div>
          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>
            {isExpired ? 'Subscription Expired!' : 'Subscription Expiring Soon!'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', marginTop: '8px' }}>
            {isExpired
              ? 'Your plan has expired. Renew now to continue using all features.'
              : `Your plan expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Renew now to avoid interruption.`
            }
          </p>
        </div>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Link
            to={`${getRolePrefix()}/subscription`}
            onClick={() => setShow(false)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff', padding: '12px 28px', borderRadius: '12px',
              fontWeight: 600, fontSize: '15px', textDecoration: 'none',
              marginBottom: '12px', transition: 'all 0.15s'
            }}
          >
            Renew Now
          </Link>
          <br />
          <button
            onClick={() => setShow(false)}
            style={{
              background: 'none', border: 'none', color: '#94a3b8',
              fontSize: '13px', cursor: 'pointer', padding: '8px 16px',
              fontWeight: 500, marginTop: '4px'
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpiryModal;
