import { onCleanup, onMount, type JSX } from 'solid-js';

interface Props {
  children: JSX.Element;
  class?: string;
  delay?: number;
}

export function Reveal(props: Props) {
  let el: HTMLDivElement | undefined;
  let observer: IntersectionObserver | undefined;

  onMount(() => {
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el?.classList.add('is-visible');
            observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -48px 0px' },
    );
    observer.observe(el);
  });

  onCleanup(() => observer?.disconnect());

  return (
    <div
      ref={el}
      class={`reveal ${props.class ?? ''}`}
      style={props.delay ? { 'transition-delay': `${props.delay}ms` } : undefined}
    >
      {props.children}
    </div>
  );
}