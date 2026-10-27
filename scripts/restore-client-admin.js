const fs = require('fs');
const admin = require('firebase-admin');

async function main() {
  const file = process.argv[2];
  const serviceAccountPath = process.argv[3] || process.env.SERVICE_ACCOUNT_PATH;

  if (!file) {
    console.error('Uso: node restore-client-admin.js <payload.json> [serviceAccountKey.json]');
    process.exit(2);
  }
  if (!serviceAccountPath) {
    console.error('É necessário fornecer o caminho para a serviceAccountKey.json como segundo argumento ou via env SERVICE_ACCOUNT_PATH');
    process.exit(2);
  }

  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const clientData = payload.payload || payload;

  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  // Se quiser especificar um id, use clientData.id
  if (clientData.id) {
    await db.collection('clients').doc(clientData.id).set(clientData, { merge: true });
    console.log('Documento atualizado em clients/', clientData.id);
  } else {
    const ref = await db.collection('clients').add(clientData);
    console.log('Novo documento criado em clients/', ref.id);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
