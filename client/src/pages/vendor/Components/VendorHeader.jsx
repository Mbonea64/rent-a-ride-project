import PropTypes from 'prop-types';
import { addVehicleClicked } from '../../../redux/adminSlices/actions';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from '../../../components/ProfileAvatar';



const VendorHeader = ({category,title}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentUser = useSelector((state) => state.user.currentUser);

  //Vendor add Vehicle
  const handleAddVehicle = () => {
    dispatch(addVehicleClicked(true));
    navigate('/vendorDashboard/vendorAddProduct')
  };

  return (
    <div className="mb-10 flex justify-between items-center ">
      <div>
      <p className="text-gray-400">
        {category}
      </p>
      <p className="text-slate--900 text-3xl font-extrabold tracking-tight ">
        {title}
      </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm md:flex">
          <ProfileAvatar
            email={currentUser?.email}
            name={currentUser?.username || "Vendor"}
            role="vendor"
            src={currentUser?.profilePicture}
            size={34}
          />
          <div className="leading-tight">
            <p className="text-xs text-gray-400">Vendor</p>
            <p className="text-sm font-semibold text-slate-800">
              {currentUser?.username || "Vendor"}
            </p>
          </div>
        </div>
        <button className='bg-blue-600 rounded-lg '>
          <div className='text-white px-5 py-2 font-bold ' onClick={handleAddVehicle}>Add+</div>
        </button>
      </div>
      
        
    </div>
  )
}
VendorHeader.propTypes = {
  category:PropTypes.string,
  title: PropTypes.string.isRequired,
};

export default VendorHeader
