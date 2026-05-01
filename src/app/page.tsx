import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-[#f8fafc] text-[#111827] fullbleed">
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif;}
        .fullbleed{
          width:100vw;
          margin-left:calc(50% - 50vw);
          margin-right:calc(50% - 50vw);
        }
        .wrap{width:100%;max-width:none;margin:0 auto;padding:0 clamp(16px,4vw,56px);}

        .hero{background:linear-gradient(135deg,#1e3a8a,#0f172a);color:white;text-align:center;padding:100px 20px;}
        .hero h1{font-size:clamp(2.1rem,6vw,3.75rem);margin-bottom:20px;line-height:1.1;}
        .hero p{font-size:clamp(1rem,2.5vw,1.375rem);max-width:750px;margin:auto;line-height:1.6;}
        .btn{display:inline-block;margin-top:22px;background:#facc15;padding:clamp(12px,2.3vw,16px) clamp(22px,4vw,38px);border-radius:10px;text-decoration:none;font-weight:bold;color:#111;font-size:clamp(1rem,2.5vw,1.05rem);}
        .section{padding:clamp(40px,7vw,80px) 0;text-align:center;}
        .section h2{font-size:clamp(1.6rem,4.2vw,2.6rem);margin-bottom:45px;line-height:1.2;}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));justify-items:stretch;gap:22px;width:100%;}
        .card{background:white;padding:clamp(18px,2.5vw,30px);border-radius:18px;width:100%;max-width:none;margin:0;box-shadow:0 4px 20px rgba(0,0,0,.08);}
        .price{font-size:clamp(1.8rem,4vw,2.2rem);font-weight:bold;margin:18px 0;}
        footer{background:#0f172a;color:white;text-align:center;padding:30px;margin-top:50px;}

        @media (max-width: 600px){
          .hero{padding:64px 14px;}
          .wrap{padding:0 14px;}
          footer{padding:22px 12px;}
        }
      `}</style>

      <section className="hero">
        <div className="wrap">
          <h1>V.I.P K.C.S.E 2026 Papers</h1>
          <p>
            Access legit exam papers and marking schemes through secure view-only subscriptions.
          </p>
          <Link href="/register" className="btn">
            Register Now
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Subscription Plans</h2>
          <div className="grid">
          <div className="card">
            <h3>Per Paper</h3>
            <div className="price">Ksh 50</div>
            <p>Buy only the paper you need.</p>
          </div>
          <div className="card">
            <h3>Weekly</h3>
            <div className="price">Ksh 250</div>
            <p>7 days unlimited access.</p>
          </div>
          <div className="card">
            <h3>Monthly</h3>
            <div className="price">Ksh 700</div>
            <p>30 days premium access.</p>
          </div>
        </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>How To Buy</h2>
          <div className="grid">
          <div className="card">
            <h3>1. Register yourself</h3>
            <p>Create your account so you can choose a plan and pay.</p>
          </div>
          <div className="card">
            <h3>2. Choose Plan</h3>
            <p>Select Per Paper, Weekly or Monthly access.</p>
          </div>
          <div className="card">
            <h3>3. Pay via M-Pesa</h3>
            <p>Use STK push to complete payment using your phone.</p>
          </div>
          <div className="card">
            <h3>4. Verify Payment</h3>
            <p>We activate access automatically after payment confirmation.</p>
          </div>
          <div className="card">
            <h3>5. Access Content</h3>
            <p>View papers instantly after approval.</p>
          </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Why Choose Us</h2>
          <div className="grid">
          <div className="card">
            <h3>Secure Access</h3>
            <p>View-only content protection.</p>
          </div>
          <div className="card">
            <h3>Fast Activation</h3>
            <p>Instant subscription approval.</p>
          </div>
          <div className="card">
            <h3>Mobile Friendly</h3>
            <p>Access from any phone or laptop.</p>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}
