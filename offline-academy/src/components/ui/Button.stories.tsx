import Button from "./Button";

export default {
  title: "UI/Button",
  component: Button,
};

export const Primary = () => <Button label="Click Me" />;
export const Secondary = () => <Button label="Cancel" variant="secondary" />;