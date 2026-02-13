const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\frontend\\app\\receptionist\\opd\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the main div with bolder styles
content = content.replace(
    /className={`group bg-white rounded-2xl p-4 border transition-all duration-300 flex flex-col md:flex-row items-center relative overflow-hidden \${highlightedOpdId === entry\.opd_id\.toString\(\)\s*\n\s*\? 'ring-4 ring-blue-500\/10 border-blue-400 shadow-2xl z-20 animate-row-pulse'\s*\n\s*: `border-slate-100 shadow-sm hover:shadow-md \${colors\.hoverBorder}`\s*\n\s*}`}/g,
    'className={`group bg-white rounded-2xl p-4 border transition-all duration-300 flex flex-col md:flex-row items-center relative overflow-hidden ${highlightedOpdId === entry.opd_id.toString()\n                                            ? \'ring-[6px] ring-blue-500/20 border-blue-500 border-2 shadow-2xl z-20 animate-row-pulse\'\n                                            : `border-slate-100 shadow-sm hover:shadow-md ${colors.hoverBorder}`\n                                            }`}'
);

// Fix animation with bolder effect
content = content.replace(
    /0% { box-shadow: 0 0 0 0 rgba\(59, 130, 246, 0\); }\s*\n\s*50% { box-shadow: 0 20px 25px -5px rgb\(59 130 246 \/ 0\.15\), 0 0 0 8px rgba\(59, 130, 246, 0\.05\); }\s*\n\s*100% { box-shadow: 0 0 0 0 rgba\(59, 130, 246, 0\); }/g,
    '0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }\n  50% { box-shadow: 0 25px 30px -5px rgb(59 130 246 / 0.2), 0 0 0 12px rgba(59, 130, 246, 0.1); }\n  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }'
);

// Fix the accent bar div space issue
content = content.replace(
    /\{\/\* Left Accent Bar \*\/\s*\}\s*?\n\s*<\s*div\s*className\s*=\s*{/g,
    '{/* Left Accent Bar */}\n                                        <div className={'
);

// Second attempt at the main fix with a broader regex if the first fails
if (!content.includes('key={entry.opd_id}')) {
    console.log("First regex failed, trying second more flexible one...");
    content = content.replace(
        /className\s*=\s*{`group bg-white rounded-2xl p-4 border transition-all duration-300 flex flex-col md:flex-row items-center relative overflow-hidden \${highlightedOpdId === entry.opd_id.toString\(\)/g,
        '<div key={entry.opd_id} id={`opd-row-${entry.opd_id}`} className={`group bg-white rounded-2xl p-4 border transition-all duration-300 flex flex-col md:flex-row items-center relative overflow-hidden ${highlightedOpdId === entry.opd_id.toString()'
    );
}

fs.writeFileSync(filePath, content);
console.log("Fixed opd/page.tsx JSX syntax.");
