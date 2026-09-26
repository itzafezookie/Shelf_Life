/**
 * Reading Speed Test Service
 * Provides authentic, distraction-free reading excerpts and calculates true WPM benchmarks.
 * Combines offline public-domain classics with on-demand online random excerpts.
 */

export const CLASSIC_EXCERPTS = [
  {
    title: 'The Time Machine',
    author: 'H.G. Wells',
    genre: 'Classic Sci-Fi',
    text: `The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated. The fire burnt brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses. Our chairs, being his patents, embraced and caressed us rather than submitted to be sat upon, and there was that luxurious after-dinner atmosphere when thought roams gracefully free of the trammels of precision. And he put it to us in this way—marking the points with a lean forefinger—as we sat and lazily admired his earnestness over this new paradox (as we thought it) and his fecundity.

"You must follow me carefully. I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, they taught you at school is founded on a misconception."

"Is not that rather a large thing to expect us to begin upon?" said Filby, an argumentative person with red hair.

"I do not mean to ask you to accept anything without reasonable ground for it. You will soon admit as much as I need from you. You know of course that a mathematical line, a line of thickness nil, has no real existence. They taught you that? Neither has a mathematical plane. These things are mere abstractions."

"That is all right," said the Psychologist.

"Nor, having only length, breadth, and thickness, can a cube have a real existence."

"There I object," said Filby. "Of course a solid body may exist. All real things—"

"So most people think. But wait a moment. Can an instantaneous cube exist?"

"Don't follow you," said Filby.

"Can a cube that does not last for any time at all, have a real existence?"`
  },
  {
    title: 'A Scandal in Bohemia',
    author: 'Arthur Conan Doyle',
    genre: 'Mystery',
    text: `To Sherlock Holmes she is always THE woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind. He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position. He never spoke of the softer passions, save with a gibe and a sneer. They were admirable things for the observer—excellent for drawing the veil from men's motives and actions. But for the trained reasoner to admit such intrusions into his own delicate and finely adjusted temperament was to introduce a distracting factor which might throw a doubt upon all his mental results. Grit in a sensitive instrument, or a crack in one of his own high-power lenses, would not be more disturbing than a strong emotion in a nature such as his. And yet there was but one woman to him, and that woman was the late Irene Adler, of dubious and questionable memory.

I had seen little of Holmes lately. My marriage had drifted us away from each other. My own complete happiness, and the home-centred interests which rise up around the man who first finds himself master of his own establishment, were sufficient to absorb all my attention, while Holmes, who loathed every form of society with his whole Bohemian soul, remained in our lodgings in Baker Street, buried among his old books, and alternating from week to week between cocaine and ambition, the drowsiness of the drug, and the fierce energy of his own keen nature.`
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Classic Literature',
    text: `In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.

"Whenever you feel like criticizing anyone," he told me, "just remember that all the people in this world haven't had the advantages that you've had."

He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I'm inclined to reserve all judgements, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores. The abnormal mind is quick to detect and attach itself to this quality when it appears in a normal person, and so it came about that in college I was unjustly accused of being a politician, because I was privy to the secret griefs of wild, unknown men. Most of the confidences were unsought—frequently I have feigned sleep, preoccupation, or a hostile levity when I realized by some unmistakable sign that an intimate revelation was quivering on the horizon; for the intimate revelations of young men, or at least the terms in which they express them, are usually plagiaristic and marred by obvious suppressions. Reserving judgements is a matter of infinite hope. I am still a little afraid of missing something if I forget that, as my father snobbishly suggested, and I snobbishly repeat, a sense of the fundamental decencies is parcelled out unequally at birth.`
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    genre: 'Classic Romance',
    text: `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.

However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.

"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"

Mr. Bennet replied that he had not.

"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."

Mr. Bennet made no answer.

"Do you not want to know who has taken it?" cried his wife impatiently.

"You want to tell me, and I have no objection to hearing it."

This was invitation enough.

"Why, my dear, you must know, Mrs. Long says that Netherfield is taken by a young man of large fortune from the north of England; that he came down on Monday in a chaise and four to see the place, and was so much delighted with it, that he agreed with Mr. Morris immediately; that he is to take possession before Michaelmas, and some of his servants are to be in the house by the end of next week."

"What is his name?"

"Bingley."

"Is he married or single?"

"Oh! Single, my dear, to be sure! A single man of large fortune; four or five thousand a year. What a fine thing for our girls!"

"How so? How can it affect them?"

"My dear Mr. Bennet," replied his wife, "how can you be so tiresome! You must know that I am thinking of his marrying one of them."`
  },
  {
    title: 'Frankenstein',
    author: 'Mary Shelley',
    genre: 'Gothic Horror',
    text: `It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.

How can I describe my emotions at this catastrophe, or how delineate the wretch whom with such infinite pains and care I had endeavoured to form? His limbs were in proportion, and I had selected his features as beautiful. Beautiful! Great God! His yellow skin scarcely covered the work of muscles and arteries beneath; his hair was of a lustrous black, and flowing; his teeth of a pearly whiteness; but these luxuriances only formed a more horrid contrast with his watery eyes, that seemed almost of the same colour as the dun-white sockets in which they were set, his shrivelled complexion and straight black lips.

The different accidents of life are not so changeable as the feelings of human nature. I had worked hard for nearly two years, for the sole purpose of infusing life into an inanimate body. For this I had deprived myself of rest and health. I had desired it with an ardour that far exceeded moderation; but now that I had finished, the beauty of the dream vanished, and breathless horror and disgust filled my heart.`
  },
  {
    title: 'Alice in Wonderland',
    author: 'Lewis Carroll',
    genre: 'Fantasy',
    text: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"

So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.

In another moment down went Alice after it, never once considering how in the world she was to get out again.`
  }
];

export const speedTestService = {
  /**
   * Count words accurately by splitting non-empty whitespace sequences.
   */
  countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    return words.length;
  },

  /**
   * Calculate WPM from words and duration seconds.
   */
  calculateWPM(words, durationSeconds) {
    if (durationSeconds <= 0 || words <= 0) return 0;
    const minutes = durationSeconds / 60;
    return Math.round(words / minutes);
  },

  /**
   * Get a random classic excerpt from our curated offline-first pool.
   */
  getRandomClassicExcerpt(excludeTitle = '') {
    const pool = CLASSIC_EXCERPTS.filter((item) => item.title !== excludeTitle);
    const chosen = pool[Math.floor(Math.random() * pool.length)] || CLASSIC_EXCERPTS[0];
    return {
      ...chosen,
      wordCount: this.countWords(chosen.text),
      source: 'Classic Literature'
    };
  },

  /**
   * Fetch a fresh, unique excerpt from the Wikipedia API to prevent skimming familiarity.
   * Falls back seamlessly to a classic excerpt if offline or API is unavailable.
   */
  async fetchFreshOnlineExcerpt(excludeTitle = '') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(
        'https://en.wikipedia.org/w/api.php?action=query&generator=random&grnnamespace=0&prop=extracts&exintro=1&explaintext=1&format=json&origin=*',
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Network error');

      const data = await res.json();
      const page = Object.values(data?.query?.pages || {})[0];

      if (page && page.extract) {
        const rawText = page.extract.replace(/\n+/g, '\n\n').trim();
        const wordCount = this.countWords(rawText);

        // Ensure excerpt is substantial enough (at least 150 words)
        if (wordCount >= 150) {
          // Truncate to around 350 words if overly long
          const words = rawText.split(/\s+/);
          const truncated = words.length > 380 ? words.slice(0, 360).join(' ') + '...' : rawText;

          return {
            title: page.title || 'World Knowledge',
            author: 'Wikipedia Compendium',
            genre: 'Knowledge & History',
            text: truncated,
            wordCount: this.countWords(truncated),
            source: 'Random Article'
          };
        }
      }
      throw new Error('Excerpt too short');
    } catch (err) {
      // Offline fallback
      return this.getRandomClassicExcerpt(excludeTitle);
    }
  },

  /**
   * Categorize reading pace with warm literary descriptions.
   */
  getPaceCategory(wpm) {
    if (wpm < 160) {
      return {
        label: 'Careful & Analytical',
        badge: 'Deep Reader',
        description: 'You savor every phrase, absorb nuances, and visualize scenes in deep detail.'
      };
    }
    if (wpm <= 230) {
      return {
        label: 'Thoughtful & Immersive',
        badge: 'Comfortable Pace',
        description: 'A cozy, leisurely cadence typical of readers who enjoy hearing the prose voice.'
      };
    }
    if (wpm <= 320) {
      return {
        label: 'Solid & Fluent',
        badge: 'Average Reader',
        description: 'The sweet spot for fluent fiction reading with high retention and steady speed.'
      };
    }
    if (wpm <= 450) {
      return {
        label: 'Fast & Breezy',
        badge: 'Quick Reader',
        description: 'You breeze through pages quickly while maintaining great narrative grasp.'
      };
    }
    return {
      label: 'Speed Reader',
      badge: 'Speed Demon',
      description: 'You take in entire sentences in rapid visual sweeps. High velocity reading!'
    };
  }
};
