const createEntity = () => ({
  list: async () => [],
  filter: async () => [],
  get: async () => null,
  create: async () => ({}),
  update: async () => ({}),
  delete: async () => ({})
})

export const AccommodationProvider = createEntity()
export const Airport = createEntity()
export const BlogArticle = createEntity()
export const CarRentalProvider = createEntity()
export const Equipment = createEntity()
export const ExpenseGroup = createEntity()
export const ExpenseSettlement = createEntity()
export const FAQ = createEntity()
export const Feedback = createEntity()
export const GroupExpense = createEntity()
export const InsuranceProvider = createEntity()
export const KosherPlace = createEntity()
export const LegalDocument = createEntity()
export const ProductCategory = createEntity()
export const ProductClick = createEntity()
export const RecommendedLink = createEntity()
export const Review = createEntity()
export const SiteSettings = createEntity()
export const SkiDestination = createEntity()
export const SkiProduct = createEntity()
export const SkiSchool = createEntity()
export const Testimonial = createEntity()
export const TripPlan = createEntity()
export const TripPreparation = createEntity()
export const VipFormField = createEntity()
export const VipFormSection = createEntity()
export const VipRequest = createEntity()