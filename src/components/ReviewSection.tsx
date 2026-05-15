import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../App';
import { Star, MessageSquarePlus, User } from 'lucide-react';
import { Review } from '../types';
import { motion } from 'motion/react';

interface ReviewSectionProps {
  providerId: string;
}

import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export default function ReviewSection({ providerId }: ReviewSectionProps) {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const q = query(
        collection(db, 'providers', providerId, 'reviews'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setReviews(snap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Review));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `providers/${providerId}/reviews`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [providerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSubmitting(true);

    try {
      await addDoc(collection(db, 'providers', providerId, 'reviews'), {
        clientId: user.uid,
        clientName: profile.fullName,
        providerId,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      setComment('');
      setRating(5);
      await fetchReviews();
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="bg-brand-card rounded-[2.5rem] p-10 shadow-sm border border-brand-border">
        <h2 className="text-2xl font-black text-white mb-10 flex items-center gap-3">
          <Star size={26} className="text-brand-accent" />
          <span>Comentários dos Clientes</span>
        </h2>

        {user && profile?.role === 'client' && (
          <form onSubmit={handleSubmit} className="mb-14 bg-brand-input p-8 rounded-[2rem] border border-brand-border-light shadow-inner">
            <h3 className="font-extrabold text-white mb-6 flex items-center gap-3 uppercase tracking-widest text-[10px]">
              <MessageSquarePlus size={20} className="text-brand-primary" />
              <span>Deixe sua avaliação</span>
            </h3>
            <div className="flex items-center gap-3 mb-8">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  className={`p-1.5 transition-brand hover:scale-125 ${i <= rating ? 'text-yellow-500' : 'text-slate-700'}`}
                >
                  <Star size={32} fill={i <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <textarea
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-6 rounded-2xl bg-brand-bg border-2 border-brand-border-light focus:border-brand-primary outline-none min-h-[120px] mb-6 shadow-inner text-white transition-brand"
              placeholder="Como foi sua experiência com este prestador?"
            />
            <button
              disabled={submitting}
              className="bg-brand-primary text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent transition-brand shadow-xl shadow-indigo-600/20 disabled:opacity-50 active:scale-95"
            >
              {submitting ? 'Publicando...' : 'Publicar Avaliação'}
            </button>
          </form>
        )}

        <div className="space-y-5">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-brand-input rounded-2xl border border-brand-border"></div>
              <div className="h-24 bg-brand-input rounded-2xl border border-brand-border"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 px-6 border-2 border-dashed border-brand-border rounded-[2rem]">
              <p className="text-slate-500 italic font-medium uppercase tracking-widest text-[10px]">Ainda não há avaliações para este perfil.</p>
            </div>
          ) : (
            reviews.map(review => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-input p-8 rounded-3xl border border-brand-border-light shadow-sm flex items-start gap-6 transition-brand hover:border-slate-700"
              >
                <div className="w-14 h-14 bg-brand-card rounded-2xl border border-brand-border flex items-center justify-center text-slate-500 shrink-0 shadow-lg">
                  <User size={28} />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-extrabold text-white text-lg">{review.clientName}</h4>
                      <div className="flex items-center gap-1 text-yellow-500 mt-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} size={14} fill={i <= review.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-brand-bg px-3 py-1.5 rounded-lg border border-brand-border">
                      {review.createdAt?.toDate().toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed italic pr-4">"{review.comment}"</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
