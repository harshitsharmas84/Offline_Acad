# 🧩 Component API Reference & Usage Guide

## Quick Reference

Import all components from a single location:
```tsx
import { Button, Card, Input, Badge, Modal, Tabs, ProgressBar } from "@/components/ui";
```

Or import individually:
```tsx
import { Button } from "@/components/ui/Button";
```

---

## Components

### Button

**Props:**
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}
```

**Examples:**
```tsx
// Primary button
<Button onClick={handleClick}>Click me</Button>

// Outline button
<Button variant="outline">Outlined</Button>

// Danger button
<Button variant="danger">Delete</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Loading state
<Button isLoading>Saving...</Button>

// Full width
<Button className="w-full">Full Width</Button>

// With icon
<Button>📚 Start Course</Button>
```

---

### Card

**Components:**
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardContent` - Body content

**Examples:**
```tsx
// Basic card
<Card>
  <CardHeader>
    <CardTitle>My Card</CardTitle>
  </CardHeader>
  <CardContent>
    Your content here
  </CardContent>
</Card>

// Custom styling
<Card className="hover:shadow-lg">
  <CardContent>Content</CardContent>
</Card>

// With header border
<Card>
  <CardHeader className="border-b pb-4">
    <CardTitle>Section</CardTitle>
    <p className="text-sm text-gray-600 mt-2">Description</p>
  </CardHeader>
  <CardContent>
    Main content
  </CardContent>
</Card>
```

---

### Input

**Props:**
```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
```

**Examples:**
```tsx
// Text input
<Input 
  type="text"
  label="Full Name"
  placeholder="John Doe"
/>

// Email with validation
<Input
  type="email"
  label="Email"
  error={emailError ? "Invalid email" : ""}
/>

// Password field
<Input
  type="password"
  label="Password"
  placeholder="••••••••"
/>

// Disabled input
<Input
  label="School"
  defaultValue="Central Academy"
  disabled
/>

// Controlled component
<Input
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
/>
```

---

### Badge

**Props:**
```tsx
interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger";
}
```

**Examples:**
```tsx
// Status badge
<Badge variant="success">Completed</Badge>
<Badge variant="warning">In Progress</Badge>
<Badge variant="danger">Not Started</Badge>
<Badge variant="primary">Beginner</Badge>

// In a card
<div className="flex justify-between">
  <h3>Course Name</h3>
  <Badge variant="primary">Intermediate</Badge>
</div>

// Multiple badges
<div className="flex gap-2">
  <Badge variant="primary">Math</Badge>
  <Badge variant="success">Completed</Badge>
</div>
```

---

### ProgressBar

**Props:**
```tsx
interface ProgressBarProps {
  value: number;
  max?: number;        // default: 100
  label?: string;
  showLabel?: boolean; // default: true
  variant?: "primary" | "success" | "warning" | "danger";
}
```

**Examples:**
```tsx
// Basic progress bar
<ProgressBar value={65} />

// With label
<ProgressBar 
  value={42}
  label="Course Progress"
/>

// Without percentage label
<ProgressBar
  value={78}
  showLabel={false}
/>

// Custom max value
<ProgressBar 
  value={24}
  max={36}
  label="Lessons (24/36)"
/>

// Color variants
<ProgressBar value={65} variant="primary" />
<ProgressBar value={85} variant="success" />
<ProgressBar value={45} variant="warning" />
<ProgressBar value={20} variant="danger" />

// Inline with course card
<div className="space-y-4">
  {courses.map((course) => (
    <div key={course.id}>
      <h3>{course.title}</h3>
      <ProgressBar 
        value={course.progress}
        label={`${course.progress}% Complete`}
      />
    </div>
  ))}
</div>
```

---

### Modal

**Props:**
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

**Examples:**
```tsx
// Basic modal
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Delete Confirmation"
>
  Are you sure you want to delete this item?
</Modal>

// Modal with footer buttons
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleDelete}>
        Delete
      </Button>
    </>
  }
>
  This action cannot be undone.
</Modal>

// Form in modal
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add New Course"
>
  <Input label="Course Name" />
  <Input label="Description" className="mt-4" />
</Modal>
```

---

### Tabs

**Props:**
```tsx
interface TabItem {
  label: string;
  value: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
}
```

**Examples:**
```tsx
// Basic tabs
<Tabs
  tabs={[
    {
      label: "Overview",
      value: "overview",
      content: <div>Overview content</div>,
    },
    {
      label: "Details",
      value: "details",
      content: <div>Details content</div>,
    },
    {
      label: "Settings",
      value: "settings",
      content: <div>Settings content</div>,
    },
  ]}
/>

// With default tab
<Tabs
  tabs={tabs}
  defaultTab="overview"
/>

// Tab with components
const courseTabData = [
  {
    label: "Lessons",
    value: "lessons",
    content: <LessonsList />,
  },
  {
    label: "Resources",
    value: "resources",
    content: <ResourcesList />,
  },
  {
    label: "Quiz",
    value: "quiz",
    content: <Quiz />,
  },
];

<Tabs tabs={courseTabData} defaultTab="lessons" />
```

---

### Spinner

**Props:**
```tsx
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

interface SkeletonLoaderProps {
  count?: number;
}
```

**Examples:**
```tsx
// Loading spinner
<Spinner />
<Spinner size="sm" />
<Spinner size="lg" />

// Skeleton loaders
<SkeletonLoader count={3} />

// In conditional rendering
{isLoading ? (
  <Spinner />
) : (
  <CoursesList />
)}

// Loading with text
<div className="flex items-center gap-2">
  <Spinner size="sm" />
  <p>Loading courses...</p>
</div>
```

---

### Badge & Alert (Bonus)

**Badge:**
```tsx
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>
```

**Alert:**
```tsx
<Alert type="info">Information message</Alert>
<Alert type="success">Success message</Alert>
<Alert type="warning">Warning message</Alert>
<Alert type="error">Error message</Alert>
```

---

## Common Patterns

### Form with Validation
```tsx
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: FormErrors = {};
    if (!email) newErrors.email = "Email required";
    if (!password) newErrors.password = "Password required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    setIsLoading(true);
    try {
      // API call
      await login(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <Input
        type="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      <Button type="submit" isLoading={isLoading} className="w-full">
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
}
```

### Progress Section
```tsx
<Card>
  <CardHeader>
    <CardTitle>Course Progress</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {courses.map((course) => (
      <div key={course.id}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">{course.title}</h4>
          <Badge variant={
            course.progress > 70 ? "success" :
            course.progress > 40 ? "warning" :
            "primary"
          }>
            {course.progress}%
          </Badge>
        </div>
        <ProgressBar value={course.progress} />
      </div>
    ))}
  </CardContent>
</Card>
```

### Status Grid
```tsx
<div className="grid md:grid-cols-3 gap-4">
  <Card>
    <CardContent className="pt-6">
      <p className="text-gray-600 text-sm">Completed</p>
      <p className="text-3xl font-bold text-green-600 mt-2">156</p>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="pt-6">
      <p className="text-gray-600 text-sm">In Progress</p>
      <p className="text-3xl font-bold text-yellow-600 mt-2">12</p>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="pt-6">
      <p className="text-gray-600 text-sm">Not Started</p>
      <p className="text-3xl font-bold text-gray-600 mt-2">8</p>
    </CardContent>
  </Card>
</div>
```

---

## Tailwind Class Reference

### Colors Used
```
Text:
- text-gray-900, text-gray-700, text-gray-600, text-gray-400
- text-white

Backgrounds:
- bg-white, bg-gray-50, bg-gray-800, bg-gray-900
- bg-indigo-600, bg-blue-600, bg-green-500, etc.

Borders:
- border-gray-200, border-gray-700, border-indigo-600

Hover:
- hover:bg-gray-100, hover:text-indigo-600
```

### Common Utilities
```
Sizing:
- w-full, w-64, h-16, h-screen

Padding/Margin:
- p-4, p-6, m-2, gap-2, gap-4

Display:
- flex, grid, hidden, absolute, sticky

Responsive:
- md:grid-cols-2, lg:grid-cols-3
```

---

## Dark Mode

All components automatically support dark mode. Customize with:
```tsx
className="dark:bg-gray-800 dark:text-white"
```

Toggle theme:
```tsx
const { theme, toggleTheme } = useUI();
```

---

## Tips & Best Practices

1. **Always use semantic HTML** - Use proper heading levels
2. **Add labels to inputs** - Accessibility is important
3. **Use variants** - Don't repeat styling
4. **Size buttons appropriately** - Larger on mobile
5. **Test dark mode** - Toggle and verify visuals
6. **Add loading states** - Show feedback during actions
7. **Validate forms** - Catch errors early
8. **Use responsive grid** - Adapt to screen size

---

## Troubleshooting

**Button not responding:**
- Check onClick is passed
- Verify no parent preventDefault

**Input not updating:**
- Use onChange handler
- Check value is controlled

**Dark mode not working:**
- Ensure UIProvider wraps app
- Check html has dark class

**Component not styled:**
- Import from correct path
- Verify Tailwind is running
- Check CSS is imported

---

**Happy building! 🚀**
