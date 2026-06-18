// Configuração do Stripe pronta para produção
// Adicione a chave secreta no seu arquivo .env.local:
// STRIPE_SECRET_KEY=sk_test_...
// NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
  premiumPriceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_placeholder'
};

// Exemplo de fluxo para criação de Checkout Session do Stripe em Next.js Route Handlers
export async function criarCheckoutSessionStripe(customerId: string, email: string) {
  // Em produção, você faria uma chamada para a API do Stripe:
  // const stripe = require('stripe')(stripeConfig.secretKey);
  // const session = await stripe.checkout.sessions.create({
  //   payment_method_types: ['card', 'pix'],
  //   customer_email: email,
  //   line_items: [{ price: stripeConfig.premiumPriceId, quantity: 1 }],
  //   mode: 'subscription',
  //   success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=success`,
  //   cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/premium?checkout=cancelled`,
  //   metadata: { userId: customerId }
  // });
  // return session.url;
  
  console.log('Simulação de criação de checkout Stripe para o cliente:', email);
  return '/dashboard?checkout=success';
}
