import { marqueeItems } from './authAssets';

export default function ImageMarquee() {
  const trackItems = [...marqueeItems, ...marqueeItems];

  return (
    <section className="auth-marquee" aria-labelledby="auth-marquee-title">
      <h2 id="auth-marquee-title" className="auth-sr-only">
        Saint Jude College community
      </h2>
      <div
        className="auth-marquee__viewport"
        tabIndex={0}
        role="region"
        aria-label="Campus community image carousel. Focus or hover to pause."
      >
        <ul className="auth-marquee__track">
          {trackItems.map((item, index) => {
            const isDuplicate = index >= marqueeItems.length;
            return (
              <li
                className="auth-marquee__card"
                key={`${item.id}-${index}`}
                aria-hidden={isDuplicate ? true : undefined}
              >
                <img src={item.src} alt={isDuplicate ? '' : item.alt} loading="lazy" />
              </li>
            );
          })}
        </ul>
      </div>
      <p className="auth-marquee__caption">Wear your story. Represent SJCM.</p>
    </section>
  );
}
