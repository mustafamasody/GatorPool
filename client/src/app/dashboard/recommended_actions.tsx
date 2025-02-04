import React from 'react'
import { StatusCard, AccountData } from '../view_controller';
import {Alert} from "@heroui/react";
import { cn, Input } from '@heroui/react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Button,
    useDisclosure,
  } from "@heroui/react";
import SetHomeAddress from './actions/set_home_address';

interface RecommendedActionsProps {
    statusCards: StatusCard[];
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const RecommendedActions: React.FC<RecommendedActionsProps> = ({ statusCards, setAccountData }) => {

    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [currentCard, setCurrentCard] = React.useState<StatusCard | null>(null);

    return (
        <div className="flex flex-col space-y-4 overflow-x-auto">
            <h1 className="text-black dark:text-white text-2xl font-RobotoSemiBold">Recommended Actions</h1>
            <div className="flex flex-row space-x-4">
            {
                statusCards.map((card) => (
                    <CustomAlert
                    key={card.uuid}
                    color={card.type}
                    title={card.title}
                    description={card.description}
                    className="min-w-96"
                    >
                    <div className="flex items-center gap-1 mt-3">
                        <Button
                        className="bg-background text-default-700 font-medium border-1 shadow-small"
                        size="sm"
                        variant="bordered"
                        onPress={() => {
                            if(card.display_type === "drawer") {
                                setCurrentCard(card);
                                onOpen();
                            }
                        }}
                        >
                        {card.action_name}
                        </Button>
                    </div>
                </CustomAlert>  
                ))
            }
            </div>

    <>
      <Drawer className="light dark:dark" isOpen={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent>
          {(onClose) => 
              currentCard?.action === "rider_add_address" ? (
                  <SetHomeAddress 
                  setAccountData={setAccountData}
                  statusCard={currentCard}
                  onClose={onClose}
                  />
              ) : (
                <h1 className="text-black dark:text-white text-2xl font-RobotoSemiBold">No action found</h1>
              )
          }
        </DrawerContent>
      </Drawer>
    </>
        </div>
    );
}

export default RecommendedActions;


interface CustomAlertProps {
    title: string;
    children: React.ReactNode;
    variant?: string;
    color?: string;
    className?: string;
    classNames?: {
      base?: string;
      mainWrapper?: string;
      iconWrapper?: string;
    };
    [key: string]: any;
  }
  
  const CustomAlert = React.forwardRef<HTMLDivElement, CustomAlertProps>(
    (
      {title, children, variant = "faded", color = "secondary", description, className, classNames = {}, ...props},
      ref,
    ) => {
      const colorClass = React.useMemo(() => {
        switch (color) {
          case "default":
            return "before:bg-default-300";
          case "primary":
            return "before:bg-primary";
          case "secondary":
            return "before:bg-secondary";
          case "success":
            return "before:bg-success";
          case "warning":
            return "before:bg-warning";
          case "danger":
            return "before:bg-danger";
          default:
            return "before:bg-default-200";
        }
      }, []);
  
      return (
        <Alert
          ref={ref as React.Ref<HTMLDivElement>}
          classNames={{
            ...classNames,
            base: cn(
              [
                "bg-default-50 dark:bg-background shadow-sm",
                "border-1 border-default-200 dark:border-default-100",
                "relative before:content-[''] before:absolute before:z-10",
                "before:left-0 before:top-[-1px] before:bottom-[-1px] before:w-1",
                "rounded-l-none border-l-0",
                colorClass,
              ],
              classNames.base,
              className,
            ),
            mainWrapper: cn("pt-1", classNames.mainWrapper),
            iconWrapper: cn("dark:bg-transparent", classNames.iconWrapper),
          }}
          color={color}
          title={title}
          description={description}
          variant={variant}
          {...props}
        >
          {children}
        </Alert>
      );
    },
  );
  
  CustomAlert.displayName = "CustomAlert";