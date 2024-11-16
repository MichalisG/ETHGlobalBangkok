import { FC, useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useReadContract, useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
// import { useEIP712SignIn } from "~~/hooks/useEIP712SignIn";

const Balance: FC<{ connectedAddress: string }> = ({ connectedAddress }) => {
  const [amount, setAmount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // const { signIn } = useEIP712SignIn();

  // useEffect(() => {
  //   if (connectedAddress) {
  //     signIn({ connectedAddress, time: new Date().getTime() });
  //   }
  // }, [signIn, connectedAddress]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const modal = document.getElementById("my_modal_1");
      if (modal && !modal.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  const { data: balance, isPending: isBalanceLoading, error: balanceError } = useReadContract({
    address: deployedContracts[23295].LUBA.address,
    abi: deployedContracts[23295].LUBA.abi,
    functionName: "getPersonalBalance",
  });

  const { data: allowance } = useReadContract({
    address: deployedContracts[23295].USDC.address,
    abi: deployedContracts[23295].USDC.abi,
    functionName: "allowance",
    args: [connectedAddress, deployedContracts[23295].LUBA.address],
  });

  const { writeContract: withdraw, error: withdrawError, isPending: isWithdrawing } = useWriteContract();
  const { writeContract: deposit, error: depositError, isPending: isDepositing } = useWriteContract();

  const { writeContract: approve, isPending: isApproving, error: approveError } = useWriteContract();

  const approveAllowance = async () => {
    approve({
      address: deployedContracts[23295].USDC.address,
      abi: deployedContracts[23295].USDC.abi,
      functionName: "approve",
      args: [deployedContracts[23295].LUBA.address, parseEther("1000000000000000000")],
      __mode: "prepared",
    });
  };

  const handleWithdraw = async () => {
    await withdraw({
      address: deployedContracts[23295].LUBA.address,
      abi: deployedContracts[23295].LUBA.abi,
      functionName: "withdrawBalance",
      __mode: "prepared",
    });
  };

  const handleDeposit = async () => {
    if (!allowance) {
      await approveAllowance();
    } else {
      await deposit({
        address: deployedContracts[23295].LUBA.address,
        abi: deployedContracts[23295].LUBA.abi,
        functionName: "addBalance",
        args: [parseEther(amount.toString())],
        __mode: "prepared",
      });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between cursor-pointer p-2" onClick={() => setIsModalOpen(true)}>
        Balance: {balance !== undefined ? formatEther(balance) : "loading..."}
      </div>
      <dialog id="my_modal_1" className="modal" open={isModalOpen}>
        <div className="modal-box bg-white shadow-xl border border-gray-200 min-w-96 p-4 rounded-lg flex flex-col gap-4">
          <h3 className="font-bold text-lg">Enter Amount</h3>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="input input-bordered w-full max-w-xs border-gray-300"
          />
          <div className="modal-action">
            <div className="flex justify-between">
              <button className="btn" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
              <button className="btn" onClick={handleDeposit} disabled={isApproving || isDepositing}>
                Deposit
              </button>
              <button className="btn btn-primary" onClick={handleWithdraw}>
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default Balance;
