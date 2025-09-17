'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useAnimate } from 'framer-motion';
import { useEffect } from 'react';
import { Users, Briefcase, BarChart3, DollarSign, Megaphone, Gavel, TrendingUp, FileText, ClipboardCheck, Award } from 'lucide-react';
import styles from './LandingPage.module.css';


function AnimatedNumber({ value, className }: { value: number, className: string }) {
  const [scope, animate] = useAnimate();
  useEffect(() => { animate(scope.current, { innerHTML: Math.round(value) }, { duration: 1.5 }); }, [value, animate, scope]);
  return <span ref={scope} className={className}>{value}</span>;
}
const Header = () => ( <header className={styles.header}> <Link href="/">
      <Image
        src="/kbl-logo-white.png" 
        alt="KBL Logo"
        width={80} 
        height={40} 
        priority
      />
    </Link> <div className={styles.headerNav}> <Link href="/login"><button className={styles.loginButton}>Log In</button></Link> <Link href="/signup"><button className={styles.signupButton}>Sign Up Free</button></Link> </div> </header> );
const DashboardPreviewCard = () => ( <div className={styles.dashboardCard}> <div className={styles.dashboardHeader}> <h3 className={styles.dashboardTitle}>Dashboard Overview</h3> <div className={styles.liveIndicator}> <span className={styles.ping}><span className={styles.pingOuter}></span><span className={styles.pingInner}></span></span> Live Data </div> </div> <div className={styles.statsGrid}> <div className={styles.statCard}><AnimatedNumber value={87} className={`${styles.statValue} text-[#0179d2]`} />%<p className={styles.statLabel}>Health Score</p></div> <div className={styles.statCard}><AnimatedNumber value={12} className={`${styles.statValue} text-[#22c55e]`} /><p className={styles.statLabel}>Opportunities</p></div> <div className={styles.statCard}><AnimatedNumber value={3} className={`${styles.statValue} text-[#ef4444]`} /><p className={styles.statLabel}>Critical Areas</p></div> </div> <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}> <div className={styles.progressItem}><p className={styles.progressLabel}>Leadership Assessment</p><div className={styles.progressBarContainer}><motion.div className={styles.progressBarFill} style={{backgroundColor: '#0179d2'}} initial={{ width: 0 }} animate={{ width: '80%' }} transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}/></div></div> <div className={styles.progressItem}><p className={styles.progressLabel}>Financial Health</p><div className={styles.progressBarContainer}><motion.div className={styles.progressBarFill} style={{backgroundColor: '#22c55e'}} initial={{ width: 0 }} animate={{ width: '92%' }} transition={{ duration: 1.5, delay: 0.7, ease: 'easeOut' }}/></div></div> <div className={styles.progressItem}><p className={styles.progressLabel}>Market Position</p><div className={styles.progressBarContainer}><motion.div className={styles.progressBarFill} style={{backgroundColor: '#f97316'}} initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 1.5, delay: 0.9, ease: 'easeOut' }}/></div></div> </div> </div> );
const Footer = () => ( <footer className={styles.footer}> <div className={styles.footerContent}> <div className={styles.footerLeft}> <div className={styles.footerLogo}><Link href="/">
      <Image
        src="/kbl-logo-blue.png" 
        alt="KBL Logo"
        width={80} 
        height={40} 
        priority
      />
    </Link></div> <p className={styles.footerCopyright}>&copy; {new Date().getFullYear()} KBL Business Diagnostics. All rights reserved.</p> </div> <div className={styles.footerLinks}> <Link href="#">Privacy</Link> <Link href="#">Terms</Link> <Link href="#">Contact</Link> </div> </div> </footer> );
const features = [ { icon: Users, title: 'Leadership Analysis', description: 'Evaluate the strength and experience of your management team.' }, { icon: Briefcase, title: 'Organizational Structure', description: 'Assess how well your company is structured to deliver on its strategy.' }, { icon: BarChart3, title: 'Sales & Marketing', description: 'Analyze your market position, sales funnels, and marketing effectiveness.' }, { icon: DollarSign, title: 'Financial Management', description: 'Gain clarity on your financial health, from cash flow to profitability.' }, { icon: Gavel, title: 'Legal & IT', description: 'Ensure your operations are compliant and your technology is up to the task.' }, { icon: TrendingUp, title: 'Growth Potential', description: 'Identify key opportunities and critical areas for future expansion.' }, ];
const FeatureSlider = () => { const duplicatedFeatures = [...features, ...features]; return ( <section className={styles.sliderSection}> <h2 className={styles.sliderTitle}>A 360° View Of Your Business</h2> <div className={styles.sliderContainer}> <motion.div className={styles.sliderTrack} animate={{ x: '-50%' }} transition={{ ease: 'linear', duration: 30, repeat: Infinity, }} > {duplicatedFeatures.map((feature, index) => ( <div key={index} className={styles.featureCard}> <feature.icon className={styles.featureCardIcon} /> <h3 className={styles.featureCardTitle}>{feature.title}</h3> <p className={styles.featureCardDescription}>{feature.description}</p> </div> ))} </motion.div> </div> </section> ); };


const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Complete The Assessment',
    description: 'Answer a comprehensive set of questions covering every facet of your business, from leadership to financials.',
  },
  {
    number: '02',
    icon: Award,
    title: 'Receive Your Score',
    description: 'Our system analyzes your responses to generate a detailed report, highlighting your strengths and critical areas for improvement.',
  },
  {
    number: '03',
    icon: ClipboardCheck,
    title: 'Create an Action Plan',
    description: 'Turn insights into action. Use your personalized report to build a strategic roadmap for sustainable growth.',
  },
];

const HowItWorks = () => (
  <section className={styles.howItWorksSection}>
    <div className={styles.container}>
      <h2 className={styles.howItWorksTitle}>Three Steps to Clarity</h2>
      <p className={styles.howItWorksSubtitle}>
        Our process is designed to be simple, insightful, and actionable. Understand your business like never before.
      </p>
      <div className={styles.stepsGrid}>
        {steps.map((step) => (
          <div key={step.number} className={styles.stepCard}>
            <div className={styles.stepNumber}>{step.number}</div>
            <div className={styles.stepContent}>
              <step.icon className={styles.stepIcon} />
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);


export default function LandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.container}>
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroHeadline}>From Data to Decision. Unlock Your Business&apos;s Potential.</h1>
            <p className={styles.heroSubheadline}>The KBL Business Diagnostic Tool helps you analyze your business&apos;s health, identify growth opportunities, and create actionable plans for success.</p>
            <Link href="/signup"><button className={`${styles.signupButton} ${styles.heroButton}`}>Get Started Now</button></Link>
          </div>
          <div><DashboardPreviewCard /></div>
        </section>
      </main>

      <FeatureSlider />
      <HowItWorks />
      <Footer />
    </div>
  );
}