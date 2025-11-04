import React, { useEffect, useState } from "react";
import "./landing.css";

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className='landing-page'>
      {/* Navigation */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className='nav-container'>
          <div className='nav-left'>
            <a href='/' className='logo'>
              EchoBox Logistics
            </a>
            <div className='nav-links'>
              <a href='#features'>Features</a>
              <a href='#how-it-works'>How it works</a>
              {/* <a href='#pricing'>Pricing</a> */}
            </div>
          </div>
          {/* <div className='nav-right'>
            <a href='#contact' className='nav-link'>
              Contact
            </a>
            <a href='/login' className='btn-secondary-nav'>
              Sign in
            </a>
            <a href='#download' className='btn-primary-nav'>
              Get started
            </a>
          </div> */}
        </div>
      </nav>

      {/* Hero Section */}
      <section className='hero'>
        <div className='hero-container'>
          <div className='hero-content'>
            <div className='badge'>Equipment tracking reimagined</div>
            <h1 className='hero-title'>
              Stop wondering where your equipment is
            </h1>
            <p className='hero-description'>
              EchoBox Logistics gives tour companies complete visibility over
              their audio equipment deliveries and pickups. Prevent channel
              conflicts, track in real-time, and ensure nothing gets forgotten.
            </p>
          </div>

          <div className='hero-visual'>
            <div className='hero-card'>
              <div className='hero-card-header'>
                <div className='status-indicator active'></div>
                <span>Live tracking</span>
              </div>
              <div className='hero-card-content'>
                <div className='metric'>
                  <span className='metric-label'>Active orders</span>
                  <span className='metric-value'>12</span>
                </div>
                <div className='metric'>
                  <span className='metric-label'>Available channels</span>
                  <span className='metric-value'>8/15</span>
                </div>
                <div className='metric'>
                  <span className='metric-label'>Riders on duty</span>
                  <span className='metric-value'>5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='hero-gradient'></div>
      </section>

      {/* Social Proof */}
      <section className='social-proof'>
        <div className='container-narrow'>
          <div className='stats-grid'>
            <div className='stat'>
              <div className='stat-value'>10k+</div>
              <div className='stat-label'>Orders managed</div>
            </div>
            <div className='stat'>
              <div className='stat-value'>99.9%</div>
              <div className='stat-label'>Uptime</div>
            </div>
            <div className='stat'>
              <div className='stat-value'>24/7</div>
              <div className='stat-label'>Support</div>
            </div>
            <div className='stat'>
              <div className='stat-value'>0</div>
              <div className='stat-label'>Forgotten pickups</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className='problem-section'>
        <div className='container'>
          <div className='section-header'>
            <h2>The problems you face every day</h2>
            <p>Managing tour equipment shouldn't be this complicated</p>
          </div>

          <div className='problem-grid'>
            <div className='problem-card'>
              <div className='problem-icon'>
                <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z'
                    fill='currentColor'
                  />
                </svg>
              </div>
              <h3>Channel conflicts</h3>
              <p>
                Two guides on the same channel. Tours talking over each other.
                Complete confusion.
              </p>
            </div>

            <div className='problem-card'>
              <div className='problem-icon'>
                <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z'
                    fill='currentColor'
                  />
                </svg>
              </div>
              <h3>Forgotten pickups</h3>
              <p>
                Equipment that should have been picked up days ago, still
                sitting there.
              </p>
            </div>

            <div className='problem-card'>
              <div className='problem-icon'>
                <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M20 2H4C2.9 2 2.01 2.9 2.01 4L2 22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z'
                    fill='currentColor'
                  />
                </svg>
              </div>
              <h3>Communication chaos</h3>
              <p>
                "Where's the rider?" "Who has that equipment?" Endless texts and
                calls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='features-section'>
        <div className='container'>
          <div className='section-header'>
            <h2>Everything you need, nothing you don't</h2>
            <p>
              Powerful features designed specifically for tour equipment
              management
            </p>
          </div>

          <div className='features-list'>
            <div className='feature-row'>
              <div className='feature-content'>
                <div className='feature-label'>
                  Automatic channel management
                </div>
                <h3>Never conflict channels again</h3>
                <p>
                  The system automatically tracks which radio channels are in
                  use and prevents double-booking. When an order completes, the
                  channel is released. No manual tracking, no spreadsheets, no
                  mistakes.
                </p>
                <ul className='feature-list'>
                  <li>Real-time channel availability</li>
                  <li>Automatic conflict prevention</li>
                  <li>Smart channel recommendations</li>
                </ul>
              </div>
              <div className='feature-visual'>
                <div className='visual-card'>
                  <div className='channel-grid'>
                    <div className='channel available'>
                      Ch 1 <span>Available</span>
                    </div>
                    <div className='channel in-use'>
                      Ch 2 <span>In use</span>
                    </div>
                    <div className='channel available'>
                      Ch 3 <span>Available</span>
                    </div>
                    <div className='channel in-use'>
                      Ch 4 <span>In use</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='feature-row reverse'>
              <div className='feature-content'>
                <div className='feature-label'>Persistent tracking</div>
                <h3>Pickups stay visible until done</h3>
                <p>
                  Orders awaiting pickup don't disappear from your dashboard.
                  They remain prominently displayed every day until someone
                  marks them complete. You'll never forget equipment again.
                </p>
                <ul className='feature-list'>
                  <li>Persistent pickup reminders</li>
                  <li>Aging indicators for overdue items</li>
                  <li>One-tap completion marking</li>
                </ul>
              </div>
              <div className='feature-visual'>
                <div className='visual-card'>
                  <div className='order-list'>
                    <div className='order-item urgent'>
                      <span className='order-status'>Awaiting pickup</span>
                      <span className='order-time'>2 days overdue</span>
                    </div>
                    <div className='order-item warning'>
                      <span className='order-status'>Awaiting pickup</span>
                      <span className='order-time'>Due today</span>
                    </div>
                    <div className='order-item'>
                      <span className='order-status'>Awaiting pickup</span>
                      <span className='order-time'>Due tomorrow</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='feature-row'>
              <div className='feature-content'>
                <div className='feature-label'>Real-time visibility</div>
                <h3>Know where everyone is</h3>
                <p>
                  See exactly where your riders are, what they're working on,
                  and where they're heading next. No more phone calls asking for
                  updates. Everyone stays in sync automatically.
                </p>
                <ul className='feature-list'>
                  <li>Live rider location tracking</li>
                  <li>Current assignment status</li>
                  <li>Estimated arrival times</li>
                </ul>
              </div>
              <div className='feature-visual'>
                <div className='visual-card'>
                  <div className='rider-list'>
                    <div className='rider-item active'>
                      <div className='rider-info'>
                        <span className='rider-name'>Marco R.</span>
                        <span className='rider-status'>En route to pickup</span>
                      </div>
                      <span className='rider-eta'>5 min</span>
                    </div>
                    <div className='rider-item'>
                      <div className='rider-info'>
                        <span className='rider-name'>Sofia M.</span>
                        <span className='rider-status'>Available</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id='how-it-works' className='how-it-works'>
        <div className='container-narrow'>
          <div className='section-header'>
            <h2>How it works</h2>
            <p>Get started in minutes, not days</p>
          </div>

          <div className='steps'>
            <div className='step'>
              <div className='step-number'>01</div>
              <h3>Create your order</h3>
              <p>
                Add delivery time, pickup time, location, guide details, and
                select a radio channel. Takes less than a minute.
              </p>
            </div>

            <div className='step-connector'></div>

            <div className='step'>
              <div className='step-number'>02</div>
              <h3>Assign your riders</h3>
              <p>
                Choose a rider for delivery and optionally a different one for
                pickup. They get instant notifications on their phone.
              </p>
            </div>

            <div className='step-connector'></div>

            <div className='step'>
              <div className='step-number'>03</div>
              <h3>Track in real-time</h3>
              <p>
                Watch orders progress through each stage. Riders update statuses
                as they complete deliveries and pickups.
              </p>
            </div>

            <div className='step-connector'></div>

            <div className='step'>
              <div className='step-number'>04</div>
              <h3>Stay informed</h3>
              <p>
                Get automatic notifications when statuses change. Everyone stays
                synchronized without phone calls or texts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section
      <section id='pricing' className='pricing-section'>
        <div className='container-narrow'>
          <div className='section-header'>
            <h2>Simple, transparent pricing</h2>
            <p>Start free, scale as you grow</p>
          </div>

          <div className='pricing-grid'>
            <div className='pricing-card'>
              <div className='pricing-header'>
                <h3>Free</h3>
                <div className='price'>
                  <span className='price-amount'>€0</span>
                  <span className='price-period'>/month</span>
                </div>
              </div>
              <ul className='pricing-features'>
                <li>Up to 50 orders/month</li>
                <li>3 riders</li>
                <li>Basic tracking</li>
                <li>Email support</li>
              </ul>
              <a href='#download' className='btn-pricing'>
                Get started
              </a>
            </div>

            <div className='pricing-card featured'>
              <div className='pricing-badge'>Most popular</div>
              <div className='pricing-header'>
                <h3>Professional</h3>
                <div className='price'>
                  <span className='price-amount'>€49</span>
                  <span className='price-period'>/month</span>
                </div>
              </div>
              <ul className='pricing-features'>
                <li>Unlimited orders</li>
                <li>Unlimited riders</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
                <li>Custom branding</li>
              </ul>
              <a href='#download' className='btn-pricing-primary'>
                Get started
              </a>
            </div>

            <div className='pricing-card'>
              <div className='pricing-header'>
                <h3>Enterprise</h3>
                <div className='price'>
                  <span className='price-amount'>Custom</span>
                </div>
              </div>
              <ul className='pricing-features'>
                <li>Everything in Professional</li>
                <li>Multiple locations</li>
                <li>API access</li>
                <li>Dedicated support</li>
                <li>SLA guarantee</li>
              </ul>
              <a href='#contact' className='btn-pricing'>
                Contact sales
              </a>
            </div>
          </div>
        </div>
      </section> */}

      {/* FAQ */}
      <section className='faq-section'>
        <div className='container-narrow'>
          <div className='section-header'>
            <h2>Frequently asked questions</h2>
          </div>

          <div className='faq-list'>
            <details className='faq-item'>
              <summary>Do I need to sign up before downloading?</summary>
              <p>
                Yes. Contact <strong>support@echoboxlogistics.com</strong> and
                we'll provide a new account for you to try.
              </p>
            </details>

            <details className='faq-item'>
              <summary>How many riders can I add to my team?</summary>
              <p>
                On the standard plan, you can add up to 3 riders. Professional
                and Enterprise plans support unlimited riders.
              </p>
            </details>

            <details className='faq-item'>
              <summary>
                Can riders see all orders or just their assignments?
              </summary>
              <p>
                Riders only see orders that are assigned to them. Administrators
                have full visibility over all orders and team members.
              </p>
            </details>

            <details className='faq-item'>
              <summary>Can I customize the radio channel range?</summary>
              <p>
                Yes. You can configure exactly which channels you use in your
                operations, and the app will adapt its recommendations
                accordingly.
              </p>
            </details>

            <details className='faq-item'>
              <summary>How is my data secured?</summary>
              <p>
                All data is encrypted in transit and at rest. We use Firebase's
                enterprise-grade security infrastructure with regular security
                audits.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className='cta-section'>
        <div className='container-narrow'>
          <div className='cta-content'>
            <h2>Ready to stop wondering?</h2>
            <p>
              Join tour companies worldwide who have eliminated equipment
              tracking chaos.
            </p>
            <div className='cta-buttons'>
              <a href='#download' className='btn-cta-primary'>
                Download for iOS
              </a>
              <a href='#download' className='btn-cta-primary'>
                Download for Android
              </a>
            </div>
            <div className='cta-note'>
              No credit card required • Free to start • Cancel anytime
            </div>
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className='footer'>
        <div className='container'>
          <div className='footer-grid'>
            <div className='footer-col'>
              <div className='footer-logo'>EchoBox Logistics</div>
              <p className='footer-description'>
                Equipment tracking for modern tour companies.
              </p>
            </div>

            {/* <div className='footer-col'>
              <h4>Product</h4>
              <ul>
                <li>
                  <a href='#features'>Features</a>
                </li>
                <li>
                  <a href='#pricing'>Pricing</a>
                </li>
                <li>
                  <a href='#how-it-works'>How it works</a>
                </li>
              </ul>
            </div> */}

            {/* <div className='footer-col'>
              <h4>Company</h4>
              <ul>
                <li>
                  <a href='#about'>About</a>
                </li>
                <li>
                  <a href='#contact'>Contact</a>
                </li>
              </ul>
            </div> */}

            <div className='footer-col'>
              <h4>Legal</h4>
              <ul>
                <li>
                  <a href='/privacy'>Privacy</a>
                </li>
                <li>
                  <a href='/terms'>Terms</a>
                </li>
              </ul>
            </div>
          </div>

          <div className='footer-bottom'>
            <p>&copy; 2025 EchoBox Logistics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
