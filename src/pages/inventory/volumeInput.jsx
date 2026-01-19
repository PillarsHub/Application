import React from 'react';
import PropTypes from 'prop-types';

const VolumeInput = ({ name, value, onChange, volumeIds }) => {
    
    
    const handleChange = (e) => {
        var result = [];

        var iName = e.target.name;
        var iVal = e.target.value;

        volumeIds.forEach(volId => {
            if (volId == iName){
                result.push({ volumeId: iName, volume: iVal });
            } else{
                var cur = value && value?.find(el => el.volumeId == volId );
                if (cur == undefined) {
                    result.push({ volumeId: volId, volume: 0 });
                } else {
                    result.push({ volumeId: cur.volumeId, volume: cur.volume });
                }
            }
        });

        onChange(name, result);
    };

    let cols = 3;
    if (volumeIds.length == 3) cols = 4
    if (volumeIds.length == 2) cols = 6
    if (volumeIds.length == 1) cols = 12

    return <>
        <div className="row">
            {volumeIds && volumeIds.map((v) =>{
                return <div key={v} className={`col-md-${cols}`}>
                    <div className="mb-3">
                        <label className="form-label">{v} Amount</label>
                        <input className="form-control" name={v} value={value && value.find(el => el.volumeId == v )?.volume || ''} onChange={handleChange} autoComplete="off" />
                        <span className="text-danger"></span>
                    </div>
                </div>
            })}
        </div>
    </>
}

export default VolumeInput;



VolumeInput.propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.array.isRequired,
    onChange: PropTypes.func,
    volumeIds: PropTypes.array.isRequired
}
