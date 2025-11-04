import { Typography, Divider } from "antd";

const { Title, Paragraph, Text } = Typography;

export function CookiePolicy() {
  return (
    <div className='min-h-screen bg-white'>
      <div className='container mx-auto max-w-4xl px-4 py-16 lg:py-24'>
        {/* Header */}
        <div className='mb-12'>
          <Title level={1} className='!mb-2 text-4xl sm:text-5xl'>
            Cookie Policy
          </Title>
          <Text type='secondary'>
            Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}
          </Text>
        </div>

        {/* Content */}
        <Typography className='prose max-w-none'>
          <section className='mb-8'>
            <Title level={3}>1. Cosa Sono i Cookie</Title>
            <Paragraph>
              I cookie sono piccoli file di testo memorizzati sul tuo
              dispositivo quando visiti un sito web. Servono a far funzionare i
              siti in modo più efficiente e a fornire informazioni ai
              proprietari del sito.
            </Paragraph>
          </section>

          <Divider />

          <section className='mb-8'>
            <Title level={3}>2. Come Utilizziamo i Cookie</Title>
            <Paragraph>Echobox Logistics utilizza cookie per:</Paragraph>
            <ul className='list-disc pl-6 mb-4 text-gray-700 space-y-2'>
              <li>Mantenere attiva la tua sessione di accesso</li>
              <li>Ricordare le tue preferenze e impostazioni</li>
              <li>Analizzare l'utilizzo della piattaforma</li>
              <li>Garantire sicurezza e prevenire frodi</li>
            </ul>
          </section>

          <Divider />

          <section className='mb-8'>
            <Title level={3}>3. Tipi di Cookie Utilizzati</Title>

            <Title level={5}>Cookie Strettamente Necessari</Title>
            <Paragraph>
              Essenziali per il funzionamento della piattaforma (autenticazione
              e sicurezza). Non possono essere disabilitati.
            </Paragraph>

            <Title level={5}>Cookie Funzionali</Title>
            <Paragraph>
              Ricordano scelte come lingua, regione e preferenze, offrendo
              un’esperienza personalizzata.
            </Paragraph>

            <Title level={5}>Cookie Analitici</Title>
            <Paragraph>
              Raccolgono dati anonimi sull’uso della piattaforma per migliorarne
              le prestazioni.
            </Paragraph>
          </section>

          <Divider />

          <section className='mb-8'>
            <Title level={3}>4. Cookie di Terze Parti</Title>
            <Paragraph>
              Potremmo utilizzare servizi di terze parti che impostano cookie:
            </Paragraph>
            <ul className='list-disc pl-6 mb-4 text-gray-700 space-y-2'>
              <li>
                <strong>Google Analytics:</strong> per analisi d’uso
              </li>
              <li>
                <strong>Firebase:</strong> per autenticazione e database
              </li>
            </ul>
          </section>

          <Divider />

          <section className='mb-8'>
            <Title level={3}>5. Durata dei Cookie</Title>
            <ul className='list-disc pl-6 mb-4 text-gray-700 space-y-2'>
              <li>
                <strong>Cookie di sessione:</strong> eliminati alla chiusura del
                browser
              </li>
              <li>
                <strong>Cookie persistenti:</strong> restano fino alla scadenza
                o rimozione manuale
              </li>
            </ul>
          </section>

          <Divider />

          <section className='mb-8'>
            <Title level={3}>6. Gestione dei Cookie</Title>
            <Paragraph>
              Puoi controllare o eliminare i cookie in qualsiasi momento. La
              disattivazione può influire su alcune funzionalità della
              piattaforma.
            </Paragraph>
            <Paragraph>
              Guide per la gestione dei cookie nei principali browser:
            </Paragraph>
            <ul className='list-disc pl-6 mb-4 text-gray-700 space-y-2'>
              <li>Chrome → Impostazioni → Privacy e sicurezza → Cookie</li>
              <li>Firefox → Opzioni → Privacy e sicurezza</li>
              <li>Safari → Preferenze → Privacy</li>
              <li>Edge → Impostazioni → Cookie e autorizzazioni sito</li>
            </ul>
          </section>

          <Divider />

          <section className='mb-8'>
            <Title level={3}>7. Modifiche a Questa Policy</Title>
            <Paragraph>
              Questa Cookie Policy può essere aggiornata periodicamente. Ti
              informeremo pubblicando la nuova versione su questa pagina.
            </Paragraph>
          </section>

          <Divider />

          <section className='mb-8'>
            <Title level={3}>8. Contatti</Title>
            <Paragraph>
              Per domande sui cookie o sulla privacy, scrivi a{" "}
              <a
                href='mailto:support@echoboxlogistics.com'
                className='text-blue-600 hover:text-blue-700'
              >
                support@echoboxlogistics.com
              </a>
              .
            </Paragraph>
          </section>
        </Typography>
      </div>
    </div>
  );
}

export default CookiePolicy;
