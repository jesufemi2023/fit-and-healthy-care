
export interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  text: string;
  time: string;
}

export interface TestimonialData {
  id: string;
  type: 'video' | 'chat' | 'before-after' | 'text';
  name: string;
  location: string;
  productUsed: string;
  heroQuote?: string;
  narrative?: string;
  // Video specific
  videoUrl?: string;
  thumbnailUrl?: string;
  // Chat specific
  chatMessages?: ChatMessage[];
  // Before/After specific
  beforeImageUrl?: string;
  afterImageUrl?: string;
}

export const TESTIMONIALS: TestimonialData[] = [
  // --- Mixed Testimonials (Video & WhatsApp interleaved) ---
  {
    id: 'v1',
    type: 'video',
    name: "Elderly Yoruba Man",
    location: "From Nigeria",
    productUsed: "",
    videoUrl: "https://21310571.s21v.faiusr.com/58/ABUIABA6GAAgmpPLiwYolJfyEA.mp4",
    thumbnailUrl: "https://res.cloudinary.com/djs7wpey6/image/upload/v1776092852/image1_grm6yi.png",
  },
  {
    id: 'w-diabetes',
    type: 'chat',
    name: "Mr. Kolawole",
    location: "Lagos",
    productUsed: "GHT Diabetes Care Pack",
    chatMessages: [
      { id: 'm1', sender: 'user', text: "Hello GHT, I'm writing to give my testimony. My sugar level was 350mg/dL two months ago.", time: "08:10 AM" },
      { id: 'm2', sender: 'support', text: "Hello Mr. Kolawole! We remember you. How is it now after the 60 days treatment?", time: "08:12 AM" },
      { id: 'm3', sender: 'user', text: "I just came back from the lab. It is now 95mg/dL! The doctor was even surprised. He asked what I was using.", time: "08:15 AM" },
      { id: 'm4', sender: 'support', text: "Praise God! That is a perfect reading. Are you still feeling the numbness in your feet?", time: "08:17 AM" },
      { id: 'm5', sender: 'user', text: "No more numbness at all. I can sleep through the night without waking up to urinate every hour. Your products are truly life savers. God bless you.", time: "08:20 AM" },
      { id: 'm6', sender: 'support', text: "Amen! We are so happy for you. Please continue with the maintenance dose to keep it stable. 🙏✨", time: "08:22 AM" },
    ]
  },
  {
    id: 'v2',
    type: 'video',
    name: "Elderly Man",
    location: "From Nigeria",
    productUsed: "Constifree Tea",
    videoUrl: "https://21310571.s21v.faiusr.com/58/ABUIABA6GAAgkZPLiwYor7SnmAc.mp4",
    thumbnailUrl: "https://res.cloudinary.com/djs7wpey6/image/upload/v1776092853/image2_pxqv8s.png",
  },
  {
    id: 'w-prostate',
    type: 'chat',
    name: "Chief Benson",
    location: "Port Harcourt",
    productUsed: "GHT Prostate Care",
    chatMessages: [
      { id: 'm1', sender: 'user', text: "Good morning. I want to order another set of the Prostate Care for my friend.", time: "09:30 AM" },
      { id: 'm2', sender: 'support', text: "Good morning Chief! Good to hear from you. How is your own recovery going?", time: "09:32 AM" },
      { id: 'm3', sender: 'user', text: "My brother, it is a miracle. Before, I couldn't even sit for 30 minutes without running to the toilet. And the pain was too much.", time: "09:35 AM" },
      { id: 'm4', sender: 'user', text: "But now, the flow is strong and the pain is completely gone. I even went for a checkup and they said the enlargement has reduced significantly.", time: "09:36 AM" },
      { id: 'm5', sender: 'support', text: "That is wonderful! GHT Prostate Care is very effective for shrinking the prostate naturally. We will process your friend's order immediately.", time: "09:40 AM" },
      { id: 'm6', sender: 'user', text: "Thank you. I have told all my age mates about this. No more surgery for us! 😂", time: "09:42 AM" },
    ]
  },
  {
    id: 'v3',
    type: 'video',
    name: "Mrs Juliana",
    location: "Kano, Nigeria",
    productUsed: "Female Care",
    videoUrl: "https://21310571.s21v.faiusr.com/58/ABUIABA6GAAgi5PLiwYo6v614gI.mp4",
    thumbnailUrl: "https://res.cloudinary.com/djs7wpey6/image/upload/v1776092854/image3_aluaih.png",
  },
  {
    id: 'w-men-health',
    type: 'chat',
    name: "Anonymous Brother",
    location: "Abuja",
    productUsed: "GHT Men's Vitality (Weak Erection/PE)",
    chatMessages: [
      { id: 'm1', sender: 'user', text: "Boss, I don't even know how to thank you. My marriage was almost breaking because of my 'performance' issue.", time: "11:05 PM" },
      { id: 'm2', sender: 'support', text: "We understand, brother. Many men face this. How has the Men's Vitality pack helped so far?", time: "08:00 AM" },
      { id: 'm3', sender: 'user', text: "Omo! The difference is clear. I used to last only 2 minutes, but now I'm going 20-30 minutes easily. My wife is so happy, she even made my favorite meal today. 😂", time: "08:05 AM" },
      { id: 'm4', sender: 'user', text: "And the erection is very hard now, like a rock. No more 'weakness' at all. I feel like a 20 year old boy again.", time: "08:06 AM" },
      { id: 'm5', sender: 'support', text: "That's the power of natural stamina! It builds your system from inside. No side effects like those blue pills. Enjoy your renewed strength! 🔥💪", time: "08:10 AM" },
    ]
  },
  {
    id: 'v4',
    type: 'video',
    name: "Mrs Francisca",
    location: "From Nigeria",
    productUsed: "B-Clear",
    videoUrl: "https://21310571.s21v.faiusr.com/58/ABUIABA6GAAg-ZLLiwYomNCCpwI.mp4",
    thumbnailUrl: "https://res.cloudinary.com/djs7wpey6/image/upload/v1776092854/image4_hho5km.png",
  },
  {
    id: 'w-fibroid',
    type: 'chat',
    name: "Mrs. Ngozi",
    location: "Enugu",
    productUsed: "GHT Fibroid/Infertility Pack",
    chatMessages: [
      { id: 'm1', sender: 'user', text: "I have good news!!! I just did my scan today.", time: "02:15 PM" },
      { id: 'm2', sender: 'support', text: "Mrs. Ngozi! We've been waiting for your update. What did the scan show?", time: "02:17 PM" },
      { id: 'm3', sender: 'user', text: "The 3 large fibroids are GONE! The doctor was looking at my old scan and the new one, he couldn't believe it. He said 'Madam, what did you take?'", time: "02:20 PM" },
      { id: 'm4', sender: 'user', text: "I told him it's GHT natural therapy. No surgery, no scars. I am so happy I can't stop crying. 😭😭😭", time: "02:21 PM" },
      { id: 'm5', sender: 'support', text: "God is great! We told you to be patient with the 3 months course. Now your womb is clean and ready for conception. ✨👶", time: "02:25 PM" },
      { id: 'm6', sender: 'user', text: "Yes! We are starting the fertility pack next. I know my baby is coming soon. Thank you GHT!", time: "02:28 PM" },
    ]
  },
  {
    id: 'v5',
    type: 'video',
    name: "Princess Kachu",
    location: "From Nigeria",
    productUsed: "Dialase, Longzit, Constifree tea, Myco-Balance ",
    videoUrl: "https://21310571.s21v.faiusr.com/58/ABUIABA6GAAg9pLLiwYohYPT7Ac.mp4",
    thumbnailUrl: "https://res.cloudinary.com/djs7wpey6/image/upload/v1776092855/image5_y0lpp8.png",
  },
  {
    id: 'w-infertility',
    type: 'chat',
    name: "Mr. & Mrs. Abiola",
    location: "Abeokuta",
    productUsed: "GHT Couple Fertility Pack",
    chatMessages: [
      { id: 'm1', sender: 'user', text: "See what God has done! (Attached: Photo of Positive Pregnancy Test) 🤰❤️", time: "07:45 AM" },
      { id: 'm2', sender: 'support', text: "CONGRATULATIONS!!! This is the best news this week! After 5 years of waiting, God has finally answered.", time: "07:48 AM" },
      { id: 'm3', sender: 'user', text: "5 years of mockery and tears. We spent so much on hospitals but GHT was the answer. My husband's low sperm count is now normal and my blocked tubes are open.", time: "07:52 AM" },
      { id: 'm4', sender: 'support', text: "We are overjoyed for your family. The Couple Pack works wonders when both partners use it together. Have you seen a doctor for confirmation?", time: "07:55 AM" },
      { id: 'm5', sender: 'user', text: "Yes, I'm 6 weeks pregnant! My husband is already buying baby clothes. 😂 We will bring the baby to your office for thanksgiving by God's grace.", time: "08:00 AM" },
    ]
  },
  {
    id: 'v6',
    type: 'video',
    name: "Elderly Woman",
    location: "From Nigeria",
    productUsed: "Sto Care, Constifree Tea",
    videoUrl: "https://21310571.s21v.faiusr.com/58/ABUIABA6GAAg55LLiwYomKXJ_QY.mp4",
    thumbnailUrl: "https://res.cloudinary.com/djs7wpey6/image/upload/v1776092855/image6_ayj7ut.png",
  },
  {
    id: 'v7',
    type: 'video',
    name: "Elderly Woman",
    location: "From Nigeria",
    productUsed: "Sto Care",
    videoUrl: "https://21310571.s21v.faiusr.com/58/ABUIABA6GAAgv5LLiwYo9KT2qgI.mp4",
    thumbnailUrl: "https://res.cloudinary.com/djs7wpey6/image/upload/v1776092856/image7_do2sgr.png",
  },
  {
    id: 'v10',
    type: 'video',
    name: "Elderly Woman",
    location: "Kogi, Nigeria",
    productUsed: "Female packs",
    videoUrl: "https://21310571.s21v.faiusr.com/58/ABUIABA6GAAg85LLiwYoz9mBvAI.mp4",
    thumbnailUrl: "https://res.cloudinary.com/djs7wpey6/image/upload/v1776092857/image10_ci26fy.png",
  },

];
