# Manual fallback: index.css import

If the script does not patch `src/index.css`, add this above `@tailwind base;`:

```css
@import './styles/ss-healthcare-brand-lock.css';
```
