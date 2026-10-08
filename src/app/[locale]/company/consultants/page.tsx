import { peoplePage } from "@/components/layout/PeoplePage";

const { generateMetadata, Page } = peoplePage("CONSULTANT", "company/consultants", "consultants");
export { generateMetadata };
export default Page;
