import type { Phase } from './cycle';

/** Ready-to-send sweet messages for a partner, by phase. Short, warm, no pressure. */
export const SWEET_TO_HER: Record<Phase, string[]> = {
  period: [
    'Thinking of you today. Want me to bring something warm? Tea, soup, anything you like 🫖',
    'No plans needed today. Just rest, I will handle everything else ❤️',
    'Sending you a big hug. Tell me what would make today easier 🤗',
    'I am ordering your favourite comfort food tonight. You just relax 🍲',
  ],
  follicular: [
    'You seem full of energy lately and I love it. Dinner out this week? 🌸',
    'Good morning, beautiful. Let us do something fun together today ✨',
    'Proud of you and everything you are doing. Just wanted you to know 💛',
    'Random thought: you make my days better. That is all 😊',
  ],
  fertile: [
    'You are glowing today. Date night, just us? 🍷',
    'Cannot stop smiling thinking about you. Free this evening? 😍',
    'You are the best part of my day. Let me take you somewhere nice 💕',
    'Wearing my favourite smile because of you today 😘',
  ],
  ovulation: [
    'You are unstoppable today. Can I celebrate you tonight? 🥂',
    'Good vibes only with you. Plan something special? 😉',
    'You light up every room. Tonight is yours, my love 🌹',
    'Missing you already. Let me make today extra special 💖',
  ],
  luteal: [
    'Slow evening together tonight? I will cook and you pick the show 🍿',
    'You work so hard. Let me take something off your plate today 🤍',
    'Just checking in. How are you feeling? No rush to answer 💬',
    'Coffee or tea on the way to you. Anything else you want? ☕',
  ],
  pms: [
    'I am here, whatever you need. Chocolate is already on its way 🍫',
    'No pressure today. If you want to talk, I am listening. If not, I will just sit with you 🫶',
    'You are doing great. I love you exactly as you are today 💗',
    'Bringing snacks and zero arguments. Tell me your order 🍩',
  ],
};

/** For someone tracking herself: easy ways to ask for what she needs. */
export const ASK_HIM: Record<Phase, string[]> = {
  period: [
    'Rough day today. Could you bring something warm and keep the evening quiet? 🫖',
    'I need extra rest today. Can you handle dinner? 🙏',
    'A hug and a hot water bottle would help a lot right now 🤗',
    'Please be patient with me today. I will make it up soon ❤️',
  ],
  follicular: [
    'I have so much energy today. Let us plan something fun this weekend! 🌸',
    'Feeling great. Dinner out tonight? ✨',
    'Want to try a new place together this week? 😊',
    'Thank you for being there. Let us do something nice soon 💛',
  ],
  fertile: [
    'Feeling good today. How about a date night? 🍷',
    'I would love some time just us this evening 😍',
    'Take me somewhere nice? I am in a great mood 💕',
    'Wanna get dressed up tonight? 😘',
  ],
  ovulation: [
    'Feeling amazing today. Let us make plans for tonight! 🥂',
    'Big energy today. Say yes to anything fun 😉',
    'I feel like celebrating. Join me? 🌹',
    'Make time for me tonight? 💖',
  ],
  luteal: [
    'Low energy lately. A calm night in would be perfect 🍿',
    'Could you help with a few things around the house today? 🤍',
    'I might be quiet today, nothing wrong. Just need a slow day 💬',
    'Tea and a cuddle later? ☕',
  ],
  pms: [
    'Mood swings are here. Please bring chocolate and patience 🍫',
    'If I snap today, it is not you. Thank you for understanding 🫶',
    'Can we keep today simple and calm? 💗',
    'Snacks, a movie and no arguments, deal? 🍩',
  ],
};

export function messageIdeas(phase: Phase, partner: boolean): string[] {
  return (partner ? SWEET_TO_HER : ASK_HIM)[phase];
}
