const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const firebaseConfig = require('./firebase-config.json');

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const clientsCol = collection(db, 'clients');
  const snapshot = await getDocs(clientsCol);
  const broken = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.corporateName || data.corporateName === '') {
      broken.push({ id: doc.id, data });
    }
  });

  if (broken.length === 0) {
    console.log('Nenhum cliente com corporateName vazio ou ausente encontrado.');
    return;
  }

  console.log('Clientes possivelmente corrompidos (corporateName ausente/vazio):');
  broken.forEach(b => {
    console.log('---');
    console.log('id:', b.id);
    console.log('cnpj:', b.data.cnpj || '<sem cnpj>');
    console.log('companyStatus:', b.data.companyStatus || '<sem status>');
    console.log('taxRegime:', b.data.taxRegime || '<sem regime>');
    console.log(JSON.stringify(b.data, null, 2));
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
