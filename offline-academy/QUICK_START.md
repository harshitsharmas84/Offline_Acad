# 🚀 Quick Start Guide - OfflineAcad UI

## Get Started in 3 Steps

### Step 1: Start the Development Server
```bash
cd offline-academy
npm run dev
```

### Step 2: Open in Browser
Navigate to: **http://localhost:3000**

### Step 3: Explore the App
Start clicking around! Everything is fully functional.

---

## 🗺️ Navigation Guide

### Without Login
- **Home** `/` - Beautiful landing page
- **Login** `/login` - Sign in page
- **Signup** `/signup` - Create account page

### After Login (Try Demo Account)
- **Dashboard** `/dashboard` - Overview with stats
- **Courses** `/courses` - Browse all courses
- **Lessons** `/lessons` - View all lessons
- **Progress** `/progress` - Track your learning
- **Settings** `/settings` - Configure preferences

---

## 🧪 How to Test

### 1. Test the Landing Page
```
Go to: http://localhost:3000
See: Hero section, features, call-to-action
Click: "Get Started Free" button
```

### 2. Test Login
```
Go to: http://localhost:3000/login
Click: "Try Demo Account"
OR
Enter any email and password (min 6 chars)
Result: Redirect to dashboard
```

### 3. Test Dashboard
```
You'll see:
- Welcome message with user name
- 4 stat cards with data
- Course progress cards
- Recent activity sidebar
- Offline content status
```

### 4. Test Dark Mode
```
Click: Moon icon in header
See: App switches to dark theme
Click: Again to switch back
```

### 5. Test Navigation
```
Use Sidebar:
- Click any menu item
- See page change
- Current page is highlighted
```

### 6. Test Responsive Design
```
Press: F12 to open DevTools
Click: Toggle device toolbar
Resize: Viewport to different sizes
See: Layout adapts smoothly
```

---

## 📋 Test Checklist

- [ ] Landing page loads correctly
- [ ] All navigation links work
- [ ] Login/Signup forms accept input
- [ ] Demo account works
- [ ] Dashboard displays stats
- [ ] Courses page shows cards
- [ ] Lessons page shows table
- [ ] Progress page shows charts
- [ ] Settings page is functional
- [ ] Dark mode toggles
- [ ] Mobile responsive
- [ ] No console errors

---

## 🎨 Customization Quick Tips

### Change Colors
Edit [globals.css](offline-academy/src/app/globals.css):
```css
/* Change primary color from indigo to purple */
from-purple-600 to-purple-800
```

### Change Hero Text
Edit [(public)/page.tsx](offline-academy/src/app/\(public\)/page.tsx):
```tsx
<h1>Your Custom Headline</h1>
```

### Add New Course
Edit [courses/page.tsx](offline-academy/src/app/courses/page.tsx):
```tsx
const allCourses = [
  // Add new course object here
];
```

### Change Logo
Edit [Header.tsx](offline-academy/src/components/layout/Header.tsx):
```tsx
<div>Replace with your logo</div>
```

---

## 🔍 File Locations

### Pages
- Landing: `src/app/(public)/page.tsx`
- Login: `src/app/(auth)/login/page.tsx`
- Signup: `src/app/(auth)/signup/page.tsx`
- Dashboard: `src/app/dashboard/page.tsx`
- Courses: `src/app/courses/page.tsx`
- Lessons: `src/app/lessons/page.tsx`
- Progress: `src/app/progress/page.tsx`
- Settings: `src/app/settings/page.tsx`

### Components
- Header: `src/components/layout/Header.tsx`
- Sidebar: `src/components/layout/Sidebar.tsx`
- Button: `src/components/ui/Button.tsx`
- Card: `src/components/ui/Card.tsx`
- Input: `src/components/ui/Input.tsx`
- Others: `src/components/ui/`

### Styles
- Global CSS: `src/app/globals.css`
- Tailwind: Configured in `tailwind.config.ts`

---

## 🔨 Common Modifications

### Add a New Page
1. Create folder: `src/app/newpage/`
2. Create file: `src/app/newpage/page.tsx`
3. Copy structure from existing page
4. Add route to Sidebar navigation

### Add a New Component
1. Create file: `src/components/ui/NewComponent.tsx`
2. Export from: `src/components/ui/index.ts`
3. Import and use in pages

### Change Default Theme
Edit [UIContext.tsx](offline-academy/src/context/UIContext.tsx):
```tsx
const [theme, setTheme] = useState<Theme>("dark"); // default to dark
```

### Add a Route
1. Create page folder: `src/app/route/page.tsx`
2. Import Header and Sidebar if needed
3. Next.js automatically creates route

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill the process or use different port
npm run dev -- -p 3001
```

### Styles Not Applying
```bash
# Rebuild Tailwind
npm run dev
# Or clear cache and restart
rm -rf .next
npm run dev
```

### Component Not Found
```bash
# Check import path
import { Button } from "@/components/ui";
# or
import { Button } from "@/components/ui/Button";
```

### Dark Mode Not Working
```bash
# Check UIProvider wraps app in layout.tsx
<UIProvider>{children}</UIProvider>

# Check html has dark class
document.documentElement.classList.add("dark");
```

---

## 📚 Documentation Files

- **UI_IMPLEMENTATION.md** - Complete feature overview
- **UI_SUMMARY.md** - Quick summary of what's built
- **COMPONENT_API.md** - Component reference & usage
- **VISUAL_SHOWCASE.md** - Visual breakdown of screens
- **QUICK_START.md** - This file!

---

## 🎯 Next Steps

1. **Test Everything** - Make sure all pages work
2. **Customize** - Change colors, text, branding
3. **Add Real Data** - Connect to your backend
4. **Deploy** - Push to Vercel or your server
5. **Iterate** - Get feedback and improve

---

## 💡 Pro Tips

1. **Use Components** - Reuse UI components across pages
2. **Dark Mode** - Always test in both themes
3. **Mobile First** - Design for mobile, scale up
4. **Accessibility** - Use semantic HTML, add labels
5. **Performance** - Use Next.js Image optimization
6. **Types** - Always use TypeScript for safety
7. **Comments** - Document complex logic
8. **Responsive** - Test on real devices, not just DevTools

---

## 🎓 Learning Resources

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## 🆘 Need Help?

1. **Check Documentation** - Read the markdown files
2. **Check Component API** - See COMPONENT_API.md
3. **Check Examples** - Look at existing pages
4. **Check Console** - Look for error messages
5. **Search Google** - Most issues have solutions online

---

## ✅ Verification Checklist

After starting dev server, verify:

- [ ] Page loads without errors
- [ ] No 404 errors
- [ ] All images load
- [ ] Buttons are clickable
- [ ] Forms accept input
- [ ] Navigation works
- [ ] Dark mode toggles
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] No TypeScript errors

---

## 🎉 You're Ready!

Everything is set up and ready to go. Start building amazing features on top of this beautiful UI!

### Quick Command Reference
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code
npx prettier --write .
```

---

## 📝 Notes

- All pages are responsive
- Dark mode works everywhere
- Components are reusable
- TypeScript for safety
- Tailwind for styling
- Context API for state
- No external dependencies needed

---

**Happy coding! 🚀 Build something amazing with OfflineAcad!**
