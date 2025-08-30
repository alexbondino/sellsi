// Infra-level TransferInfoManager (movido desde shared/components/managers)
// Rompe ciclo: managers ya no dependen del barrel de shared components.
import { useTransferInfoPreloader } from '../../shared/hooks/profile/useTransferInfoPreloader';
export const TransferInfoManager = () => { useTransferInfoPreloader(); return null; };
export default TransferInfoManager;
