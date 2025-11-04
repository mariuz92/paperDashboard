import React from "react";
import { Layout, Typography, Divider, Card } from "antd";

const { Content } = Layout;
const { Title, Paragraph, Text, Link } = Typography;

export function PrivacyPolicy() {
  return (
    <Layout style={{ background: "#fff", minHeight: "100vh" }}>
      <Content
        style={{ maxWidth: 900, margin: "0 auto", padding: "4rem 1.5rem" }}
      >
        <Typography>
          {/* Header */}
          <Title level={1} style={{ marginBottom: "1rem" }}>
            Informativa sulla Privacy
          </Title>
          <Text type='secondary'>
            Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}
          </Text>
          <Paragraph type='secondary' style={{ marginTop: 8 }}>
            Ai sensi del Regolamento (UE) 2016/679 (GDPR) e del D.Lgs. 196/2003
            come modificato dal D.Lgs. 101/2018
          </Paragraph>

          <Divider />

          {/* Section 1 */}
          <Title level={2}>1. Titolare del Trattamento</Title>
          <Paragraph>
            Il Titolare del trattamento dei dati personali è{" "}
            <Text strong>Echobox Logistics</Text>. Puoi contattarci via email a{" "}
            <Link href='mailto:support@echoboxlogistics.com'>
              support@echoboxlogistics.com
            </Link>
            .
          </Paragraph>
          <Paragraph>
            Per richieste relative al trattamento dei tuoi dati personali, puoi
            contattare il nostro Responsabile della Protezione dei Dati (DPO) a:{" "}
            <Link href='mailto:support@echoboxlogistics.com'>
              support@echoboxlogistics.com
            </Link>
            .
          </Paragraph>

          <Divider />

          {/* Section 2 */}
          <Title level={2}>2. Tipologie di Dati Raccolti</Title>
          <Paragraph>
            La piattaforma Echobox Logistics raccoglie e tratta le seguenti
            categorie di dati personali:
          </Paragraph>

          <Title level={4}>2.1 Dati di Registrazione e Account</Title>
          <ul>
            <li>Nome e cognome</li>
            <li>Indirizzo email</li>
            <li>Numero di telefono</li>
            <li>Password (memorizzata in forma crittografata)</li>
            <li>Ragione sociale dell'azienda</li>
            <li>Ruolo aziendale</li>
          </ul>

          <Title level={4} style={{ marginTop: 24 }}>
            2.2 Dati Operativi
          </Title>
          <ul>
            <li>
              Informazioni sugli ordini (orari, indirizzi di consegna e ritiro,
              dettagli attrezzature)
            </li>
            <li>
              Dati di geolocalizzazione dei rider (solo durante le consegne
              attive)
            </li>
            <li>Assegnazioni dei canali radio</li>
            <li>Stati e cronologia degli ordini</li>
            <li>Comunicazioni e notifiche inviate tramite la piattaforma</li>
          </ul>

          <Title level={4} style={{ marginTop: 24 }}>
            2.3 Dati Tecnici e di Utilizzo
          </Title>
          <ul>
            <li>Indirizzo IP</li>
            <li>Tipo e versione del browser</li>
            <li>Sistema operativo del dispositivo</li>
            <li>Date e orari di accesso</li>
            <li>Pagine visitate e funzionalità utilizzate</li>
            <li>Log di sistema e dati di diagnostica</li>
          </ul>

          <Divider />

          {/* Section 3 */}
          <Title level={2}>3. Finalità del Trattamento e Base Giuridica</Title>
          <Paragraph>
            I tuoi dati personali sono trattati per le seguenti finalità:
          </Paragraph>

          <Title level={4}>
            3.1 Erogazione del Servizio{" "}
            <Text type='secondary'>
              (Base giuridica: Esecuzione del contratto)
            </Text>
          </Title>
          <ul>
            <li>Creazione e gestione dell'account utente</li>
            <li>Gestione ordini di consegna e ritiro</li>
            <li>Assegnazione automatica dei canali radio</li>
            <li>Tracciamento consegne</li>
            <li>Invio notifiche operative</li>
          </ul>

          <Title level={4} style={{ marginTop: 24 }}>
            3.2 Miglioramento del Servizio{" "}
            <Text type='secondary'>(Base giuridica: Legittimo interesse)</Text>
          </Title>
          <ul>
            <li>Analisi dell’utilizzo per ottimizzare le funzionalità</li>
            <li>Risoluzione di problemi tecnici</li>
            <li>Sviluppo di nuove funzionalità</li>
            <li>Test A/B e miglioramento UX</li>
          </ul>

          <Title level={4} style={{ marginTop: 24 }}>
            3.3 Sicurezza e Prevenzione Frodi{" "}
            <Text type='secondary'>(Base giuridica: Legittimo interesse)</Text>
          </Title>
          <ul>
            <li>Protezione della piattaforma da accessi non autorizzati</li>
            <li>Prevenzione attività fraudolente</li>
            <li>Monitoraggio sicurezza dei sistemi</li>
          </ul>

          <Card
            title='3.5 Marketing'
            size='small'
            style={{ backgroundColor: "#f0f5ff", marginTop: 24 }}
          >
            <Paragraph>
              Solo previo tuo consenso, potremmo usare i tuoi dati per:
            </Paragraph>
            <ul>
              <li>Invio di newsletter e comunicazioni promozionali</li>
              <li>Informazioni su nuove funzionalità</li>
              <li>Inviti a eventi e webinar</li>
            </ul>
            <Paragraph type='secondary' italic>
              Puoi revocare il consenso in qualsiasi momento dal tuo account o
              dal link di disiscrizione in ogni email.
            </Paragraph>
          </Card>

          <Divider />

          {/* Section 6 Example */}
          <Title level={2}>6. Sicurezza dei Dati</Title>
          <Paragraph>
            Adottiamo misure di sicurezza tecniche e organizzative per
            proteggere i tuoi dati, tra cui:
          </Paragraph>
          <ul>
            <li>Crittografia SSL/TLS</li>
            <li>Autenticazione e controllo accessi</li>
            <li>Backup e disaster recovery</li>
            <li>Pseudonimizzazione dei dati</li>
          </ul>

          <Divider />

          {/* Section 9 */}
          <Title level={2}>9. Contatti</Title>
          <Card size='small' bordered>
            <Paragraph>
              Per qualsiasi domanda o richiesta relativa alla privacy:
            </Paragraph>
            <Paragraph>
              <Text strong>Email: </Text>
              <Link href='mailto:support@echoboxlogistics.com'>
                support@echoboxlogistics.com
              </Link>
            </Paragraph>
          </Card>

          <Divider />
          <Paragraph
            type='secondary'
            style={{ textAlign: "center", marginTop: 32 }}
          >
            Questa informativa è conforme al Regolamento (UE) 2016/679 (GDPR) e
            al D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018.
          </Paragraph>
        </Typography>
      </Content>
    </Layout>
  );
}

export default PrivacyPolicy;
