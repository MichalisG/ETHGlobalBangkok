import { FC, useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { formatEther, parseEther } from 'viem'


const Balance: FC = () => {
  const [amount, setAmount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data } = useReadContract({
    address: deployedContracts[23295].LUBA.address,
    abi: deployedContracts[23295].LUBA.abi,
    functionName: "getPersonalBalance",
  });

  const { writeContract: withdraw } = useWriteContract();
  const { writeContract: deposit } = useWriteContract();

  const handleWithdraw = async () => {
    await withdraw({
      address: deployedContracts[23295].LUBA.address,
      abi: deployedContracts[23295].LUBA.abi,
      functionName: "withdrawBalance",
    });
  };

  const handleDeposit = async () => {
    await deposit({
      address: deployedContracts[23295].LUBA.address,
      abi: deployedContracts[23295].LUBA.abi,
      functionName: "addBalance",
      args: [parseEther(amount.toString())],
    });
  };

  return <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      Balance: {data !== undefined ? formatEther(data): 'loading...'}
      <button className="btn btn-secondary" onClick={() => setIsModalOpen(true)}>Deposit</button>
      <button className="btn btn-primary" onClick={handleWithdraw}>Withdraw</button>

      <dialog id="my_modal_1" className="modal" open={isModalOpen}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Enter Amount</h3>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(Number(e.target.value))}
            className="input input-bordered w-full max-w-xs"
          />
          <div className="modal-action">
          <button className="btn" onClick={() => setIsModalOpen(false)}>Close</button>
          <button className="btn" onClick={handleDeposit}>Deposit</button>
          </div>
        </div>
      </dialog>
    </div>;
};

export default Balance;
