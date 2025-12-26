import React, { useEffect, useState } from "react";
import "./landing.css";

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className='landing-page'>
      {/* Navigation */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className='nav-container'>
          <a href='/' className='logo'>
            EchoBox Logistics
          </a>
          <div className='nav-links'>
            <a href='#features'>Features</a>
            <a href='#how-it-works'>How it works</a>
            <a href='#problems'>Problems</a>
            <a href='#contact' className='nav-cta'>
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className='hero'>
        <div className='hero-container'>
          <div className='hero-badge'>
            <span className='status-dot'></span>
            Live Tracking Active
          </div>
          <h1>
            Complete Control Over Your{" "}
            <span className='gradient-text'>Audio Equipment</span> Operations
          </h1>
          <p className='hero-description'>
            EchoBox Logistics gives tour companies complete visibility over
            their audio equipment deliveries and pickups. Prevent channel
            conflicts, track in real-time, and ensure nothing gets forgotten.
            Built for tour operations where timing and coordination are
            critical.
          </p>
          <div className='hero-buttons'>
            <a href='#contact' className='btn-primary'>
              Start Free Trial
            </a>
            <a href='#how-it-works' className='btn-secondary'>
              See How It Works
            </a>
          </div>

          {/* Stats Preview */}
          <div className='app-preview'>
            <div className='preview-card'>
              <div className='preview-icon'>🚚</div>
              <div className='preview-value'>42</div>
              <div className='preview-label'>Active Orders</div>
            </div>
            <div className='preview-card'>
              <div className='preview-icon'>⏱️</div>
              <div className='preview-value'>12</div>
              <div className='preview-label'>Out for Delivery</div>
            </div>
            <div className='preview-card'>
              <div className='preview-icon'>📦</div>
              <div className='preview-value'>8</div>
              <div className='preview-label'>Awaiting Pickup</div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className='stats-bar'>
        <div className='stats-container'>
          <div className='stat-item'>
            <div className='preview-icon'>📦</div>
            <div className='stat-value'>10k+</div>
            <div className='stat-label'>Orders Managed</div>
          </div>
          <div className='stat-item'>
            <div className='preview-icon'>✅</div>
            <div className='stat-value'>99.9%</div>
            <div className='stat-label'>Uptime Guarantee</div>
          </div>
          <div className='stat-item'>
            <div className='preview-icon'>🕐</div>
            <div className='stat-value'>24/7</div>
            <div className='stat-label'>Support Available</div>
          </div>
          <div className='stat-item'>
            <div className='preview-icon'>🎯</div>
            <div className='stat-value'>0</div>
            <div className='stat-label'>Forgotten Pickups</div>
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section className='solution-overview'>
        <div className='container'>
          <div className='section-header'>
            <div className='section-label'>The Solution</div>
            <h2 className='section-title'>
              Everything You Need, Nothing You Don't
            </h2>
            <p className='section-subtitle'>
              Powerful features designed specifically for tour equipment
              management
            </p>
          </div>

          <div className='solution-cards'>
            <div className='solution-card'>
              <h3>Never Conflict Channels Again</h3>
              <p>
                The system automatically tracks which radio channels are in use
                and prevents double-booking. When an order completes, the
                channel is released. No manual tracking, no spreadsheets, no
                mistakes. You get real-time channel availability, automatic
                conflict prevention, and smart channel recommendations based on
                current usage.
              </p>
            </div>

            <div className='solution-card'>
              <h3>Pickups Stay Visible Until Done</h3>
              <p>
                Orders awaiting pickup don't disappear from your dashboard. They
                remain prominently displayed every day until someone marks them
                complete. You'll never forget equipment again. The system
                includes persistent pickup reminders, aging indicators for
                overdue items, and one-tap completion marking.
              </p>
            </div>

            <div className='solution-card'>
              <h3>Know Where Everyone Is</h3>
              <p>
                See exactly where your riders are, what they're working on, and
                where they're heading next. No more phone calls asking for
                updates. Everyone stays in sync automatically. Track live rider
                locations, view current assignment status, and see estimated
                arrival times—all in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section id='problems' className='problems-section'>
        <div className='container'>
          <div className='section-header'>
            <div className='section-label'>The Problem</div>
            <h2 className='section-title'>The Chaos You Deal With Every Day</h2>
            <p className='section-subtitle'>
              Tour equipment management shouldn't be this complicated
            </p>
          </div>

          <div className='problem-grid'>
            <div className='problem-card'>
              <div className='problem-header'>
                <h3>Channel Conflicts</h3>
                <span className='badge warning'>Critical Issue</span>
              </div>
              <p>
                Two guides on the same radio channel. Tours talking over each
                other. Complete confusion for everyone involved. Without
                automated tracking, channel conflicts are inevitable—and they
                ruin the experience.
              </p>
            </div>

            <div className='problem-card'>
              <div className='problem-header'>
                <h3>Forgotten Pickups</h3>
                <span className='badge pickup'>Operational Risk</span>
              </div>
              <p>
                Equipment that should have been picked up days ago, still
                sitting there. No persistent reminders means things slip through
                the cracks. You only notice when it's too late.
              </p>
            </div>

            <div className='problem-card'>
              <div className='problem-header'>
                <h3>Communication Chaos</h3>
                <span className='badge delivery'>Daily Frustration</span>
              </div>
              <p>
                "Where's the rider?" "Who has that equipment?" Endless texts and
                calls. No centralized system means constant interruptions and
                information scattered across dozens of chat threads.
              </p>
            </div>

            <div className='problem-card'>
              <div className='problem-header'>
                <h3>Zero Visibility</h3>
                <span className='badge available'>Blind Operations</span>
              </div>
              <p>
                You don't know where riders are, what they're working on, or
                when they'll finish. Manual processes and scattered information
                make it impossible to get a real-time view of operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Status Section */}
      <section className='status-section'>
        <div className='container'>
          <div className='section-header'>
            <div className='section-label'>Live Dashboard</div>
            <h2 className='section-title'>Real-Time Operations at a Glance</h2>
            <p className='section-subtitle'>
              See exactly what's happening with your equipment right now
            </p>
          </div>

          <div className='order-grid'>
            <div className='order-card'>
              <div className='order-header'>
                <h3>Order #1847</h3>
                <span className='badge delivery'>In Consegna</span>
              </div>
              <div className='order-info'>
                <div className='info-row'>
                  <div className='info-icon'>🚴</div>
                  <div className='info-text'>
                    <h4>Rider</h4>
                    <p>Dan Joe</p>
                  </div>
                </div>
                <div className='info-row'>
                  <div className='info-icon'>⏰</div>
                  <div className='info-text'>
                    <h4>Delivery Time</h4>
                    <p>10:40 - Colosseo</p>
                  </div>
                </div>
                <div className='info-row'>
                  <div className='info-icon'>📍</div>
                  <div className='info-text'>
                    <h4>ETA</h4>
                    <p>15 minutes</p>
                  </div>
                </div>
              </div>
            </div>

            <div className='order-card'>
              <div className='order-header'>
                <h3>Order #1843</h3>
                <span className='badge pickup'>Attesa Ritiro</span>
              </div>
              <div className='order-info'>
                <div className='info-row'>
                  <div className='info-icon'>🚴</div>
                  <div className='info-text'>
                    <h4>Assigned Rider</h4>
                    <p>Dan Joe</p>
                  </div>
                </div>
                <div className='info-row'>
                  <div className='info-icon'>⏰</div>
                  <div className='info-text'>
                    <h4>Pickup Time</h4>
                    <p>22:40 - Verona</p>
                  </div>
                </div>
                <div className='info-row'>
                  <div className='info-icon'>📅</div>
                  <div className='info-text'>
                    <h4>Status</h4>
                    <p>Due Today</p>
                  </div>
                </div>
              </div>
            </div>

            <div className='order-card'>
              <div className='order-header'>
                <h3>Dan Joe</h3>
                <span className='badge available'>Libero</span>
              </div>
              <div className='order-info'>
                <div className='info-row'>
                  <div className='info-icon'>📊</div>
                  <div className='info-text'>
                    <h4>Status</h4>
                    <p>Ritirato</p>
                  </div>
                </div>
                <div className='info-row'>
                  <div className='info-icon'>🕐</div>
                  <div className='info-text'>
                    <h4>Last Update</h4>
                    <p>22:42 - 29/10/2025</p>
                  </div>
                </div>
                <div className='info-row'>
                  <div className='info-icon'>📍</div>
                  <div className='info-text'>
                    <h4>Location</h4>
                    <p>Verona, VR, Italia</p>
                  </div>
                </div>
              </div>
            </div>

            <div className='order-card'>
              <div className='order-header'>
                <h3>Order #1852</h3>
                <span className='badge warning'>Scheduled</span>
              </div>
              <div className='order-info'>
                <div className='info-row'>
                  <div className='info-icon'>📅</div>
                  <div className='info-text'>
                    <h4>Delivery</h4>
                    <p>Tomorrow 10:00</p>
                  </div>
                </div>
                <div className='info-row'>
                  <div className='info-icon'>🚴</div>
                  <div className='info-text'>
                    <h4>Rider</h4>
                    <p>To be assigned</p>
                  </div>
                </div>
                <div className='info-row'>
                  <div className='info-icon'>📦</div>
                  <div className='info-text'>
                    <h4>Status</h4>
                    <p>Awaiting delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='features-section'>
        <div className='container'>
          <div className='section-header'>
            <div className='section-label'>Features</div>
            <h2 className='section-title'>
              Everything You Need to Manage Equipment
            </h2>
          </div>

          <div className='features-grid'>
            <div className='feature-card'>
              <div className='feature-icon'>📻</div>
              <h3>Automatic Channel Management</h3>
              <p>
                The system automatically tracks which radio channels are in use
                and prevents double-booking. When an order completes, the
                channel is released. No manual tracking, no spreadsheets, no
                mistakes.
              </p>
            </div>

            <div className='feature-card'>
              <div className='feature-icon'>📍</div>
              <h3>Real-Time Visibility</h3>
              <p>
                See exactly where your riders are, what they're working on, and
                where they're heading next. No more phone calls asking for
                updates. Everyone stays in sync automatically.
              </p>
            </div>

            <div className='feature-card'>
              <div className='feature-icon'>📌</div>
              <h3>Persistent Pickup Tracking</h3>
              <p>
                Orders awaiting pickup don't disappear from your dashboard. They
                remain prominently displayed every day until someone marks them
                complete. You'll never forget equipment again.
              </p>
            </div>

            <div className='feature-card'>
              <div className='feature-icon'>⏱️</div>
              <h3>Aging Indicators</h3>
              <p>
                Visual alerts show which pickups are overdue and by how long.
                See at a glance what needs immediate attention versus what's on
                schedule.
              </p>
            </div>

            <div className='feature-card'>
              <div className='feature-icon'>🎯</div>
              <h3>Smart Channel Recommendations</h3>
              <p>
                Based on current availability and usage patterns, the system
                suggests the best channels for new orders, optimizing your radio
                spectrum usage.
              </p>
            </div>

            <div className='feature-card'>
              <div className='feature-icon'>✅</div>
              <h3>One-Tap Completion</h3>
              <p>
                Riders can mark deliveries and pickups complete with a single
                tap. Status updates propagate instantly to all team members.
              </p>
            </div>

            <div className='feature-card'>
              <div className='feature-icon'>🔔</div>
              <h3>Instant Notifications</h3>
              <p>
                Get automatic notifications when statuses change. Everyone stays
                synchronized without phone calls or texts cluttering your day.
              </p>
            </div>

            <div className='feature-card'>
              <div className='feature-icon'>📊</div>
              <h3>Estimated Arrival Times</h3>
              <p>
                Track real-time ETA for all active deliveries. Guides know
                exactly when to expect equipment, improving tour start
                reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id='how-it-works' className='how-it-works'>
        <div className='container'>
          <div className='section-header'>
            <div className='section-label'>Process</div>
            <h2 className='section-title'>How It Works</h2>
            <p className='section-subtitle'>
              Get started in minutes, not hours
            </p>
          </div>

          <div className='timeline'>
            <div className='timeline-item'>
              <div className='timeline-number'>1</div>
              <div className='timeline-content'>
                <h3>Create Your Order</h3>
                <p>
                  Add delivery time, pickup time, location, guide details, and
                  select an available radio channel. The system shows you which
                  channels are free and recommends optimal choices. Takes less
                  than a minute to complete, with all critical information
                  structured and clear.
                </p>
              </div>
            </div>

            <div className='timeline-item'>
              <div className='timeline-number'>2</div>
              <div className='timeline-content'>
                <h3>Assign Your Riders</h3>
                <p>
                  Choose a rider for delivery and optionally assign a different
                  one for pickup. They receive instant push notifications on
                  their mobile devices with all order details. The system tracks
                  rider availability and shows you who's currently free versus
                  occupied.
                </p>
              </div>
            </div>

            <div className='timeline-item'>
              <div className='timeline-number'>3</div>
              <div className='timeline-content'>
                <h3>Track in Real-Time</h3>
                <p>
                  Watch orders progress through each stage: created, en route to
                  delivery, delivered, awaiting pickup, en route to pickup,
                  completed. Riders update statuses with a single tap as they
                  work. See live location tracking and estimated arrival times
                  for all active deliveries.
                </p>
              </div>
            </div>

            <div className='timeline-item'>
              <div className='timeline-number'>4</div>
              <div className='timeline-content'>
                <h3>Stay Informed</h3>
                <p>
                  Receive automatic notifications when statuses change, when
                  pickups become overdue, or when riders complete their
                  assignments. Everyone on your team stays synchronized without
                  constant phone calls or text message chains. Channels are
                  automatically released when orders complete.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id='contact' className='cta-section'>
        <div className='cta-container'>
          <h2>Ready to Stop Wondering?</h2>
          <p>
            Join tour companies worldwide who have eliminated equipment tracking
            chaos. No more channel conflicts, no more forgotten pickups, no more
            communication breakdowns. Get complete visibility over your audio
            equipment operations.
          </p>
          <div className='hero-buttons'>
            <a
              href='mailto:support@echoboxlogistics.com'
              className='btn-primary'
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='footer'>
        <div className='footer-content'>
          <div className='footer-brand'>
            <h3>EchoBox Logistics</h3>
            <p>
              Equipment tracking for modern tour companies. Real-time
              visibility, automated management, zero forgotten pickups.
            </p>
          </div>
          <div className='footer-links'>
            <div className='footer-col'>
              <h4>Product</h4>
              <ul>
                <li>
                  <a href='#features'>Features</a>
                </li>
                <li>
                  <a href='#how-it-works'>How It Works</a>
                </li>
                <li>
                  <a href='#problems'>Problems</a>
                </li>
              </ul>
            </div>
            <div className='footer-col'>
              <h4>Legal</h4>
              <ul>
                <li>
                  <a href='/privacy'>Privacy Policy</a>
                </li>
                <li>
                  <a href='/terms'>Terms of Service</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className='footer-bottom'>
          <p>&copy; 2025 EchoBox Logistics. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
