import React, { useEffect } from 'react';

const SEOHead = ({ title, description, canonical, ogImage, ogType = 'website' }) => {
    useEffect(() => {
        if (title) {
            document.title = title;
            // Update OG title as well
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) ogTitle.setAttribute('content', title);
            const twitterTitle = document.querySelector('meta[name="twitter:title"]');
            if (twitterTitle) twitterTitle.setAttribute('content', title);
        }

        if (description) {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) metaDescription.setAttribute('content', description);

            const ogDescription = document.querySelector('meta[property="og:description"]');
            if (ogDescription) ogDescription.setAttribute('content', description);

            const twitterDescription = document.querySelector('meta[name="twitter:description"]');
            if (twitterDescription) twitterDescription.setAttribute('content', description);
        }

        if (canonical) {
            const canonicalTag = document.querySelector('link[rel="canonical"]');
            if (canonicalTag) canonicalTag.setAttribute('href', canonical);
        }

        if (ogImage) {
            const ogImageTag = document.querySelector('meta[property="og:image"]');
            if (ogImageTag) ogImageTag.setAttribute('content', ogImage);

            const twitterImageTag = document.querySelector('meta[name="twitter:image"]');
            if (twitterImageTag) twitterImageTag.setAttribute('content', ogImage);
        }
    }, [title, description, canonical, ogImage]);

    return null; // This component handles side effects, no UI
};

export default SEOHead;
