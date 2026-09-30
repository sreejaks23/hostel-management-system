const Loader = ({ full }) => (
  <div className={full ? "min-h-screen flex items-center justify-center" : "flex items-center justify-center py-10"}>
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
  </div>
);

export default Loader;
