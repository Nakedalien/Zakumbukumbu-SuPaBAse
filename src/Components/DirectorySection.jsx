import { useEffect } from 'react';
import './DirectorySection.css';

const directoryGroups = [
  {
    title: 'Announcements & Media',
    services: [
      {
        id: 'obituaries-notices',
        name: 'Obituaries & Notices',
        tagline: 'Share the news respectfully and keep family and friends updated.',
      },
      {
        id: 'programs-printing',
        name: 'Programs & Printing',
        tagline: 'Design and print beautiful eulogy booklets, banners, and digital programs.',
      },
      {
        id: 'photography-livestreaming',
        name: 'Photography & Livestreaming',
        tagline: 'Capture the memories or stream the service for loved ones far away.',
      },
    ],
  },
  {
    title: 'Funeral Logistics',
    services: [
      {
        id: 'mortuary-services',
        name: 'Mortuary Services',
        tagline: 'Find professional care, preservation, and preparation facilities near you.',
      },
      {
        id: 'hearse-transport',
        name: 'Hearse & Transport',
        tagline: 'Secure reliable, dignified transportation for your loved one and family.',
      },
      {
        id: 'caskets-coffins',
        name: 'Caskets & Coffins',
        tagline: 'Browse quality, respectful resting places crafted by vetted local artisans.',
      },
      {
        id: 'tents-seating-venues',
        name: 'Tents, Seating & Venues',
        tagline: 'Set up a comfortable space for family and guests to gather and pay respects.',
      },
    ],
  },
  {
    title: 'Wellness & Care',
    services: [
      {
        id: 'palliative-care',
        name: 'Palliative Care',
        tagline: 'Access specialized medical comfort and compassionate support during transitions.',
      },
      {
        id: 'grief-counseling',
        name: 'Grief Counseling',
        tagline: 'Connect with professional counselors to support you through the healing journey.',
      },
    ],
  },
];

const allServices = directoryGroups.flatMap((group) => (
  group.services.map((service) => ({ ...service, group: group.title }))
));

function DirectorySection() {
  useEffect(() => {
    const elements = document.querySelectorAll('.directory-reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          entry.target.classList.remove('is-visible');
        }
      });
    }, {
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.16,
    });

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section className="directory-section" aria-labelledby="directory-title">
      <div className="directory-shell">
        <div className="directory-heading directory-reveal">
          <span>Directory</span>
          <h2 id="directory-title">Find funeral, media, and care support in one place.</h2>
        </div>

        <div className="directory-map" aria-label="Service directory">
          {directoryGroups.map((group, index) => (
            <article
              className="directory-group directory-reveal"
              key={group.title}
              style={{ '--reveal-delay': `${index * 80}ms` }}
            >
              <h3>{group.title}</h3>
              <div>
                {group.services.map((service) => (
                  <a href={`#${service.id}`} key={service.id}>{service.name}</a>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="directory-services">
          {allServices.map((service, index) => (
            <article
              className="directory-card directory-reveal"
              id={service.id}
              key={service.id}
              style={{ '--reveal-delay': `${Math.min(index, 5) * 55}ms` }}
            >
              <span>{service.group}</span>
              <h3>{service.name}</h3>
              <p>{service.tagline}</p>
              <a href="/#/Contact">Ask for details</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DirectorySection;
