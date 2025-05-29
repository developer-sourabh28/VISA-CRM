import TeamMember from '../../models/settings/TeamManagement.js';

export const getAll = async (req, res) => {
  const members = await TeamMember.find();
  res.json(members);
};

export const create = async (req, res) => {
  try {
    const member = new TeamMember(req.body);
    await member.save();
    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await TeamMember.findByIdAndDelete(id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    } 
    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const member = await TeamMember.findByIdAndUpdate(id, updatedData, { new: true });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.status(200).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
