export function ThemeScript() {
  const code = `(function(){try{var s=localStorage.getItem('itHelpdeskTheme');var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.add(s==='dark'||(s!=='light'&&d)?'dark':'');}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
