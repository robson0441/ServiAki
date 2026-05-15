import { fakerPT_BR as faker } from '@faker-js/faker';
import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

const CATEGORIES = [
  'Limpeza', 'Reformas', 'Cuidados', 'Tecnologia', 'Aulas', 'Eventos', 'Consultoria', 'Saúde', 'Outros'
];

const CITIES = [
  { city: 'São Paulo', state: 'SP', lat: -23.5505, lng: -46.6333 },
  { city: 'Rio de Janeiro', state: 'RJ', lat: -22.9068, lng: -43.1729 },
  { city: 'Recife', state: 'PE', lat: -8.0476, lng: -34.8770 },
  { city: 'Curitiba', state: 'PR', lat: -25.4284, lng: -49.2733 },
  { city: 'Belo Horizonte', state: 'MG', lat: -19.9167, lng: -43.9345 },
  { city: 'Porto Alegre', state: 'RS', lat: -30.0346, lng: -51.2177 },
  { city: 'Salvador', state: 'BA', lat: -12.9714, lng: -38.5014 },
  { city: 'Fortaleza', state: 'CE', lat: -3.7319, lng: -38.5267 },
];

export async function generateDemoData(count: number = 5) {
  const batch = writeBatch(db);

  for (let i = 0; i < count; i++) {
    const uid = `demo_${faker.string.alphanumeric(10)}`;
    const location = faker.helpers.arrayElement(CITIES);
    const role = faker.helpers.arrayElement(['provider', 'client']);
    
    const profile: any = {
      uid,
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number({ style: 'international' }),
      role: role as any,
      status: 'active',
      address: {
        cep: faker.location.zipCode('########'),
        street: faker.location.street(),
        number: faker.number.int({ min: 1, max: 2000 }).toString(),
        neighborhood: faker.location.secondaryAddress(),
        city: location.city,
        state: location.state,
        coordinates: {
          lat: location.lat + (Math.random() - 0.5) * 0.1,
          lng: location.lng + (Math.random() - 0.5) * 0.1,
        }
      },
      createdAt: serverTimestamp(),
    };

    if (role === 'provider') {
      profile.bio = faker.lorem.paragraph();
      profile.category = faker.helpers.arrayElement(CATEGORIES);
      profile.hourlyRate = faker.number.int({ min: 30, max: 250 });
    }

    const userRef = doc(db, 'users', uid);
    batch.set(userRef, profile);

    // If it's a provider, add some reviews
    if (role === 'provider') {
      const reviewCount = faker.number.int({ min: 2, max: 5 });
      for (let j = 0; j < reviewCount; j++) {
        const reviewId = faker.string.alphanumeric(12);
        const reviewRef = doc(collection(db, 'providers', uid, 'reviews'), reviewId);
        batch.set(reviewRef, {
          id: reviewId,
          clientId: `demo_client_${faker.string.alphanumeric(5)}`,
          clientName: faker.person.fullName(),
          rating: faker.number.int({ min: 4, max: 5 }), // Keep it positive as requested "para alegrar"
          comment: faker.helpers.arrayElement([
            'Excelente profissional! Recomendo muito.',
            'Muito pontual e educado. Fez um ótimo trabalho.',
            'Surpreendeu minhas expectativas. Nota 10!',
            'O melhor que já contratei nessa área.',
            'Preço justo e trabalho de qualidade.',
            'Voltarei a contratar com certeza.',
            'Atendimento impecável do início ao fim.',
          ]),
          createdAt: serverTimestamp(),
        });
      }
    }
  }

  await batch.commit();
}
