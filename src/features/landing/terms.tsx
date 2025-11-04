import { Typography } from "antd";
const { Title, Paragraph } = Typography;

export function TermsAndConditions() {
  return (
    <div className='min-h-screen bg-white'>
      <div className='container mx-auto max-w-4xl px-4 py-16 lg:py-24'>
        {/* Header */}
        <div className='mb-12'>
          <Title level={1} className='!mb-4 text-4xl sm:text-5xl font-semibold'>
            Termini e Condizioni
          </Title>
          <Paragraph className='text-gray-600'>
            Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}
          </Paragraph>
        </div>

        {/* Content */}
        <div className='prose prose-lg max-w-none'>
          <section className='mb-8'>
            <Title level={3} className='!mb-4 text-2xl font-semibold'>
              1. Accettazione dei Termini
            </Title>
            <Paragraph className='mb-4 text-gray-700 leading-relaxed'>
              Utilizzando Echobox Logistics, accetti di essere vincolato da
              questi Termini e Condizioni. Se non accetti questi termini, non
              utilizzare la piattaforma.
            </Paragraph>
          </section>

          <section className='mb-8'>
            <Title level={3} className='!mb-4 text-2xl font-semibold'>
              2. Descrizione del Servizio
            </Title>
            <Paragraph className='mb-4 text-gray-700 leading-relaxed'>
              Echobox Logistics fornisce una piattaforma software per la
              gestione di ordini, consegne e ritiri di attrezzature per aziende
              di tour. Il servizio include:
            </Paragraph>
            <ul className='list-disc pl-6 mb-4 text-gray-700 space-y-2'>
              <li>Gestione automatica dei canali radio</li>
              <li>Tracciamento degli ordini in tempo reale</li>
              <li>Assegnazione e coordinamento dei rider</li>
              <li>Notifiche e aggiornamenti di stato</li>
            </ul>
          </section>

          <section className='mb-8'>
            <Title level={3} className='!mb-4 text-2xl font-semibold'>
              3. Registrazione e Account
            </Title>
            <Paragraph className='mb-4 text-gray-700 leading-relaxed'>
              Per utilizzare la piattaforma, devi:
            </Paragraph>
            <ul className='list-disc pl-6 mb-4 text-gray-700 space-y-2'>
              <li>
                Fornire informazioni accurate e complete durante la
                registrazione
              </li>
              <li>Mantenere la sicurezza delle tue credenziali di accesso</li>
              <li>
                Notificarci immediatamente di qualsiasi accesso non autorizzato
              </li>
              <li>Essere responsabile di tutte le attività sul tuo account</li>
            </ul>
          </section>

          <section className='mb-8'>
            <Title level={3} className='!mb-4 text-2xl font-semibold'>
              4. Uso Accettabile
            </Title>
            <Paragraph className='mb-4 text-gray-700 leading-relaxed'>
              Ti impegni a non:
            </Paragraph>
            <ul className='list-disc pl-6 mb-4 text-gray-700 space-y-2'>
              <li>Utilizzare la piattaforma per scopi illegali</li>
              <li>Interferire con il funzionamento del servizio</li>
              <li>Tentare di accedere a dati o sistemi non autorizzati</li>
              <li>Violare i diritti di proprietà intellettuale</li>
              <li>Caricare malware o codice dannoso</li>
            </ul>
          </section>

          <section className='mb-8'>
            <Title level={3} className='!mb-4 text-2xl font-semibold'>
              5. Proprietà Intellettuale
            </Title>
            <Paragraph className='mb-4 text-gray-700 leading-relaxed'>
              Tutti i diritti di proprietà intellettuale relativi alla
              piattaforma Echobox Logistics, inclusi software, design, contenuti
              e marchi, sono di proprietà esclusiva di Echobox Logistics.
            </Paragraph>
          </section>

          <section className='mb-8'>
            <Title level={3} className='!mb-4 text-2xl font-semibold'>
              6. Disponibilità del Servizio
            </Title>
            <Paragraph className='mb-4 text-gray-700 leading-relaxed'>
              Ci impegniamo a mantenere la piattaforma disponibile, ma non
              garantiamo un servizio ininterrotto. Potremmo sospendere
              temporaneamente il servizio per manutenzione o aggiornamenti,
              fornendo preavviso quando possibile.
            </Paragraph>
          </section>

          <section className='mb-8'>
            <Title level={3} className='!mb-4 text-2xl font-semibold'>
              7. Limitazione di Responsabilità
            </Title>
            <Paragraph className='mb-4 text-gray-700 leading-relaxed'>
              Echobox Logistics non sarà responsabile per danni indiretti,
              incidentali o consequenziali derivanti dall'uso o
              dall'impossibilità di utilizzare il servizio, inclusi ma non
              limitati a perdite di profitti, dati o opportunità commerciali.
            </Paragraph>
          </section>

          <section className='mb-8'>
            <Title level={3} className='!mb-4 text-2xl font-semibold'>
              8. Modifiche ai Termini
            </Title>
            <Paragraph className='mb-4 text-gray-700 leading-relaxed'>
              Ci riserviamo il diritto di modificare questi termini in qualsiasi
              momento. Le modifiche saranno effettive immediatamente dopo la
              pubblicazione. L'uso continuato della piattaforma costituisce
              accettazione dei termini modificati.
            </Paragraph>
          </section>

          <section className='mb-8'>
            <Title level={3} className='!mb-4 text-2xl font-semibold'>
              9. Legge Applicabile
            </Title>
            <Paragraph className='mb-4 text-gray-700 leading-relaxed'>
              Questi termini sono regolati dalla legge italiana. Qualsiasi
              controversia sarà di competenza esclusiva del foro di [Città].
            </Paragraph>
          </section>

          <section className='mb-8'>
            <Title level={3} className='!mb-4 text-2xl font-semibold'>
              10. Contatti
            </Title>
            <Paragraph className='mb-4 text-gray-700 leading-relaxed'>
              Per domande riguardo questi termini, contattaci a:{" "}
              <a
                href='mailto:support@echoboxlogistics.com'
                className='text-blue-600 hover:text-blue-700'
              >
                support@echoboxlogistics.com
              </a>
            </Paragraph>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditions;
